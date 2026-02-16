/**
 * repository.js - Data Access Layer (Repository Pattern)
 * 
 * This is the ONLY layer that touches the database.
 * The rest of the app calls these functions.
 * 
 * When migrating to Postgres/MySQL, replace these implementations
 * with fetch() calls to a REST API — the function signatures stay identical.
 */

/*
 * Chore Chart
 * Copyright (C) 2026 smurf-frank
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const ChoreRepository = {
    // ── Actors (polymorphic entity system) ───────────────────

    /**
     * Get all actors, optionally filtered by type.
     * @param {string} [type] - Optional type filter: 'person', 'group', 'ai_agent', 'webhook', 'chore_chart'
     * @returns {Array<{id, type, name, initials, color, metadata}>}
     */
    getAllActors(type) {
        const db = getDb();
        let sql = "SELECT id, type, name, initials, color, metadata FROM actors";
        const params = [];
        if (type) {
            sql += " WHERE type = ?";
            params.push(type);
        }
        sql += " ORDER BY id";
        const result = db.exec(sql, params);
        if (!result.length) return [];
        return result[0].values.map(row => ({
            id: row[0], type: row[1], name: row[2],
            initials: row[3], color: row[4],
            metadata: JSON.parse(row[5] || '{}')
        }));
    },

    /**
     * Convenience: get all person-type actors.
     */
    getAllPeople() {
        return this.getAllActors('person');
    },

    /**
     * Add a new actor.
     * @param {string} type - 'person' | 'group' | 'ai_agent' | 'webhook' | 'chore_chart'
     * @param {string} name
     * @param {string} initials
     * @param {string} color
     * @param {object} [metadata={}]
     */
    addActor(type, name, initials, color, metadata = {}) {
        const db = getDb();
        db.run(
            "INSERT INTO actors (type, name, initials, color, metadata) VALUES (?, ?, ?, ?, ?)",
            [type, name, initials, color, JSON.stringify(metadata)]
        );
        saveDatabase();
    },

    /**
     * Convenience: add a person.
     */
    addPerson(name, initials, color) {
        this.addActor('person', name, initials, color);
    },

    /**
     * Update an actor's fields.
     * @param {number} id
     * @param {{name?, initials?, color?, metadata?}} fields
     */
    updateActor(id, fields) {
        const db = getDb();
        const sets = [];
        const params = [];
        if (fields.name !== undefined) { sets.push("name = ?"); params.push(fields.name); }
        if (fields.initials !== undefined) { sets.push("initials = ?"); params.push(fields.initials); }
        if (fields.color !== undefined) { sets.push("color = ?"); params.push(fields.color); }
        if (fields.metadata !== undefined) { sets.push("metadata = ?"); params.push(JSON.stringify(fields.metadata)); }
        if (!sets.length) return;
        params.push(id);
        db.run(`UPDATE actors SET ${sets.join(', ')} WHERE id = ?`, params);
        saveDatabase();
    },

    /**
     * Remove an actor (person or group).
     * If removing a person, also remove them from any groups they are in.
     */
    removeActor(id) {
        const db = getDb();

        // 1. Remove from assignments
        db.run("DELETE FROM assignments WHERE actor_id = ?", [id]);

        // 2. Remove from groups (if this actor was a member)
        const groups = this.getAllGroups();
        groups.forEach(group => {
            if (group.memberIds && group.memberIds.includes(id)) {
                const newMembers = group.memberIds.filter(m => m !== id);
                this.updateActor(group.id, { metadata: { ...group.metadata, memberIds: newMembers } });
            }
        });

        // 3. Delete the actor itself
        db.run("DELETE FROM actors WHERE id = ?", [id]);
        saveDatabase();
    },

    // Legacy alias
    removePerson(id) {
        this.removeActor(id);
    },

    // ── Groups ──────────────────────────────────────────────

    getAllGroups() {
        const groups = this.getAllActors('group');
        return groups.map(g => ({
            ...g,
            showAsMarker: !!g.metadata.showAsMarker,
            memberIds: g.metadata.memberIds || []
        }));
    },

    addGroup(name, initials, color, showAsMarker = false, memberIds = []) {
        this.addActor('group', name, initials, color, {
            showAsMarker,
            memberIds
        });
    },

    updateGroup(id, fields) {
        // Map top-level fields to metadata if needed
        const metaUpdates = {};
        if (fields.showAsMarker !== undefined) metaUpdates.showAsMarker = fields.showAsMarker;
        if (fields.memberIds !== undefined) metaUpdates.memberIds = fields.memberIds;

        // If we have other metadata updates, merge them
        if (fields.metadata) {
            Object.assign(metaUpdates, fields.metadata);
        }

        const actorUpdates = {};
        if (fields.name !== undefined) actorUpdates.name = fields.name;
        if (fields.initials !== undefined) actorUpdates.initials = fields.initials;
        if (fields.color !== undefined) actorUpdates.color = fields.color;

        if (Object.keys(metaUpdates).length > 0) {
            // We need to merge with existing metadata to not lose data
            // But updateActor overwrites metadata.
            // Wait, updateActor implementation:
            // if (fields.metadata !== undefined) { sets.push("metadata = ?"); params.push(JSON.stringify(fields.metadata)); }
            // It completely replaces metadata.
            // So we must fetch current first?
            // Actually, let's optimize updateActor to merge?
            // No, avoid changing core too much. existing usage might rely on overwrite.
            // Let's safe-merge here.

            const current = this.getAllActors().find(a => a.id === id);
            if (current) {
                actorUpdates.metadata = { ...current.metadata, ...metaUpdates };
            }
        }

        this.updateActor(id, actorUpdates);
    },

    getGroupMembers(groupId) {
        const group = this.getAllGroups().find(g => g.id === groupId);
        if (!group || !group.memberIds || !group.memberIds.length) return [];

        const allActors = this.getAllActors();
        return allActors.filter(a => group.memberIds.includes(a.id));
    },

    /**
     * Check if a member can be added to a group.
     * Enforces:
     * 1. No self-reference.
     * 2. No circular dependency.
     * 3. Max nesting depth of 3 (Groups only).
     */
    canAddMember(groupId, memberId) {
        if (groupId === memberId) return false;

        // 1. Cycle Check: Does memberId set contain groupId?
        if (this.isDescendant(memberId, groupId)) return false;

        // 2. Depth Check:
        // Max chain of GROUPS must be <= 3.
        // We calculate max depth of the member's tree (if it's a group).
        // Then we calculate max height of the group's ancestors.
        if (!this.isValidDepth(groupId, memberId)) return false;

        return true;
    },

    isDescendant(parentId, targetId) {
        const members = this.getGroupMembers(parentId);
        for (const m of members) {
            if (m.id === targetId) return true;
            if (m.type === 'group') {
                if (this.isDescendant(m.id, targetId)) return true;
            }
        }
        return false;
    },

    isValidDepth(parentId, newMemberId, maxLevel = 3) {
        // Calculate max depth of the new branch (newMember)
        const childDepth = this.getGroupDepth(newMemberId);

        // Calculate max 'height' of parent (chains leading TO parent)
        const parentHeight = this.getGroupHeight(parentId);

        // Total chain = Height + 1 (connection) + Depth
        // Nodes = H + 1 + D.
        // If H=1 (Parent is root), D=1 (Leaf group), Total = 3 nodes.
        // If Total > maxLevel, fail.
        return (parentHeight + childDepth) < maxLevel;
    },

    // Max length of chain of groups downwards from id
    getGroupDepth(id) {
        const actor = this.getAllActors().find(a => a.id === id);
        if (!actor || actor.type !== 'group') return 0; // People are 0 depth in group-chain

        const members = this.getGroupMembers(id);
        const groupMembers = members.filter(m => m.type === 'group');
        if (groupMembers.length === 0) return 1; // Itself is 1

        const depths = groupMembers.map(m => this.getGroupDepth(m.id));
        return 1 + Math.max(...depths);
    },

    // Max length of chain of groups upwards to id
    getGroupHeight(id) {
        const groups = this.getAllGroups();
        // Find who has 'id' as member
        const parents = groups.filter(g => g.memberIds.includes(id));
        if (parents.length === 0) return 1; // Itself is 1

        const heights = parents.map(p => this.getGroupHeight(p.id));
        return 1 + Math.max(...heights);
    },

    // ── Chores ──────────────────────────────────────────────

    getAllChores() {
        const db = getDb();
        const result = db.exec("SELECT id, name, sort_order FROM chores ORDER BY sort_order, id");
        if (!result.length) return [];
        return result[0].values.map(row => ({
            id: row[0], name: row[1], sortOrder: row[2]
        }));
    },

    addChore(name) {
        const db = getDb();
        const maxOrder = db.exec("SELECT COALESCE(MAX(sort_order), 0) FROM chores");
        const nextOrder = maxOrder[0].values[0][0] + 1;
        db.run("INSERT INTO chores (name, sort_order) VALUES (?, ?)", [name, nextOrder]);
        saveDatabase();
    },

    removeChore(id) {
        const db = getDb();
        db.run("DELETE FROM assignments WHERE chore_id = ?", [id]);
        db.run("DELETE FROM chores WHERE id = ?", [id]);
        saveDatabase();
    },

    /**
     * Update a chore's fields.
     * @param {number} id
     * @param {{name?, sortOrder?}} fields
     */
    updateChore(id, fields) {
        const db = getDb();
        const sets = [];
        const params = [];
        if (fields.name !== undefined) { sets.push("name = ?"); params.push(fields.name); }
        if (fields.sortOrder !== undefined) { sets.push("sort_order = ?"); params.push(fields.sortOrder); }
        if (!sets.length) return;
        params.push(id);
        db.run(`UPDATE chores SET ${sets.join(', ')} WHERE id = ?`, params);
        saveDatabase();
    },

    /**
     * Update the sort_order for a list of chore IDs.
     * @param {number[]} orderedIds 
     */
    updateChoreOrders(orderedIds) {
        const db = getDb();
        orderedIds.forEach((id, index) => {
            db.run("UPDATE chores SET sort_order = ? WHERE id = ?", [index + 1, id]);
        });
        saveDatabase();
    },

    // ── Assignments ─────────────────────────────────────────

    /**
     * Get all assignments as a map: { "choreId-dayIndex": [ {actorId, name, initials, color, type}, ... ] }
     */
    getAllAssignments() {
        const db = getDb();
        const result = db.exec(`
            SELECT a.chore_id, a.day_index, a.actor_id,
                   ac.name, ac.initials, ac.color, ac.type
            FROM assignments a
            JOIN actors ac ON a.actor_id = ac.id
            ORDER BY a.id
        `);
        if (!result.length) return {};

        const map = {};
        result[0].values.forEach(row => {
            const key = `${row[0]}-${row[1]}`;
            if (!map[key]) map[key] = [];
            map[key].push({
                actorId: row[2],
                name: row[3],
                initials: row[4],
                color: row[5],
                type: row[6]
            });
        });
        return map;
    },

    /**
     * Add an actor to a cell. Returns false if cell is full or actor already assigned.
     */
    addAssignment(choreId, dayIndex, actorId) {
        const db = getDb();
        const max = this.getMaxMarkersPerCell();

        // Check current count
        const countResult = db.exec(
            "SELECT COUNT(*) FROM assignments WHERE chore_id = ? AND day_index = ?",
            [choreId, dayIndex]
        );
        const count = countResult[0].values[0][0];
        if (count >= max) return false;

        // Check for duplicate
        const dupResult = db.exec(
            "SELECT COUNT(*) FROM assignments WHERE chore_id = ? AND day_index = ? AND actor_id = ?",
            [choreId, dayIndex, actorId]
        );
        if (dupResult[0].values[0][0] > 0) return false;

        db.run(
            "INSERT INTO assignments (chore_id, day_index, actor_id) VALUES (?, ?, ?)",
            [choreId, dayIndex, actorId]
        );
        saveDatabase();
        return true;
    },

    /**
     * Remove a specific actor from a cell.
     */
    removeAssignment(choreId, dayIndex, actorId) {
        const db = getDb();
        db.run(
            "DELETE FROM assignments WHERE chore_id = ? AND day_index = ? AND actor_id = ?",
            [choreId, dayIndex, actorId]
        );
        saveDatabase();
    },

    /**
     * Legacy single-assignment: clear cell then set one actor.
     */
    setAssignment(choreId, dayIndex, actorId) {
        const db = getDb();
        db.run("DELETE FROM assignments WHERE chore_id = ? AND day_index = ?", [choreId, dayIndex]);
        db.run(
            "INSERT INTO assignments (chore_id, day_index, actor_id) VALUES (?, ?, ?)",
            [choreId, dayIndex, actorId]
        );
        saveDatabase();
    },

    clearAssignment(choreId, dayIndex) {
        const db = getDb();
        db.run("DELETE FROM assignments WHERE chore_id = ? AND day_index = ?", [choreId, dayIndex]);
        saveDatabase();
    },

    // ── Board Reset ─────────────────────────────────────────

    clearAllAssignments() {
        const db = getDb();
        db.run("DELETE FROM assignments");
        saveDatabase();
    },

    // ── Settings ────────────────────────────────────────────

    getSetting(key) {
        const db = getDb();
        const result = db.exec("SELECT value FROM settings WHERE key = ?", [key]);
        if (!result.length || !result[0].values.length) return null;
        return result[0].values[0][0];
    },

    setSetting(key, value) {
        const db = getDb();
        db.run(`
            INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `, [key, value]);
        saveDatabase();
    },

    getWeekStartDay() {
        return this.getSetting('week_start_day') || 'Mon';
    },

    setWeekStartDay(day) {
        this.setSetting('week_start_day', day);
    },

    getMaxMarkersPerCell() {
        const val = this.getSetting('max_markers_per_cell');
        const n = parseInt(val, 10);
        return isNaN(n) ? 2 : Math.max(0, Math.min(32, n));
    },

    setMaxMarkersPerCell(n) {
        const clamped = Math.max(0, Math.min(32, parseInt(n, 10) || 2));
        this.setSetting('max_markers_per_cell', String(clamped));
    },

    getRowShadingEnabled() {
        const val = this.getSetting('row_shading_enabled');
        return val === 'true';
    },

    setRowShadingEnabled(enabled) {
        this.setSetting('row_shading_enabled', String(enabled));
    },

    getRowShadingColor() {
        return this.getSetting('row_shading_color') || '#f8f9fa';
    },

    setRowShadingColor(color) {
        this.setSetting('row_shading_color', color);
    },

    getChoreColumnWidth() {
        const w = parseInt(this.getSetting('chore_col_width'), 10);
        return isNaN(w) ? 200 : w;
    },

    setChoreColumnWidth(width) {
        this.setSetting('chore_col_width', width);
    }
};
