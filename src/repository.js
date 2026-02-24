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
     * @returns {Promise<Array<{id, type, name, initials, color, metadata}>>}
     */
    async getAllActors(type) {
        let sql = 'SELECT id, type, name, initials, color, metadata FROM actors';
        const params = [];
        if (type) {
            sql += ' WHERE type = ?';
            params.push(type);
        }
        sql += ' ORDER BY id';
        const rows = await dbQuery(sql, params);
        return rows.map((row) => ({
            id: row.id,
            type: row.type,
            name: row.name,
            initials: row.initials,
            color: row.color,
            metadata: JSON.parse(row.metadata || '{}')
        }));
    },

    /**
     * Convenience: get all person-type actors.
     */
    async getAllPeople() {
        return await this.getAllActors('person');
    },

    /**
     * Add a new actor.
     */
    async addActor(type, name, initials, color, metadata = {}) {
        await dbExecute(
            'INSERT INTO actors (type, name, initials, color, metadata) VALUES (?, ?, ?, ?, ?)',
            [type, name, initials, color, JSON.stringify(metadata)]
        );
    },

    /**
     * Convenience: add a person.
     */
    async addPerson(name, initials, color) {
        await this.addActor('person', name, initials, color);
    },

    /**
     * Update an actor's fields.
     */
    async updateActor(id, fields) {
        const sets = [];
        const params = [];
        if (fields.name !== undefined) {
            sets.push('name = ?');
            params.push(fields.name);
        }
        if (fields.initials !== undefined) {
            sets.push('initials = ?');
            params.push(fields.initials);
        }
        if (fields.color !== undefined) {
            sets.push('color = ?');
            params.push(fields.color);
        }
        if (fields.metadata !== undefined) {
            sets.push('metadata = ?');
            params.push(JSON.stringify(fields.metadata));
        }
        if (!sets.length) return;
        params.push(id);
        await dbExecute(`UPDATE actors SET ${sets.join(', ')} WHERE id = ?`, params);
    },

    /**
     * Remove an actor (person or group).
     * If removing a person, also remove them from any groups they are in.
     */
    async removeActor(id) {
        await dbExecute('DELETE FROM assignments WHERE actor_id = ?', [id]);

        const groups = await this.getAllGroups();
        for (const group of groups) {
            if (group.memberIds && group.memberIds.includes(id)) {
                const newMembers = group.memberIds.filter((m) => m !== id);
                await this.updateActor(group.id, {
                    metadata: { ...group.metadata, memberIds: newMembers }
                });
            }
        }

        await dbExecute('DELETE FROM actors WHERE id = ?', [id]);
    },

    // Legacy alias
    async removePerson(id) {
        await this.removeActor(id);
    },

    // ── Groups ──────────────────────────────────────────────

    async getAllGroups() {
        const groups = await this.getAllActors('group');
        return groups.map((g) => ({
            ...g,
            showAsMarker: !!g.metadata.showAsMarker,
            memberIds: g.metadata.memberIds || []
        }));
    },

    async addGroup(name, initials, color, showAsMarker = false, memberIds = []) {
        await this.addActor('group', name, initials, color, {
            showAsMarker,
            memberIds
        });
    },

    async updateGroup(id, fields) {
        const metaUpdates = {};
        if (fields.showAsMarker !== undefined) metaUpdates.showAsMarker = fields.showAsMarker;
        if (fields.memberIds !== undefined) metaUpdates.memberIds = fields.memberIds;

        if (fields.metadata) {
            Object.assign(metaUpdates, fields.metadata);
        }

        const actorUpdates = {};
        if (fields.name !== undefined) actorUpdates.name = fields.name;
        if (fields.initials !== undefined) actorUpdates.initials = fields.initials;
        if (fields.color !== undefined) actorUpdates.color = fields.color;

        if (Object.keys(metaUpdates).length > 0) {
            const allActors = await this.getAllActors();
            const current = allActors.find((a) => a.id === id);
            if (current) {
                actorUpdates.metadata = { ...current.metadata, ...metaUpdates };
            }
        }

        await this.updateActor(id, actorUpdates);
    },

    async getGroupMembers(groupId) {
        const groups = await this.getAllGroups();
        const group = groups.find((g) => g.id === groupId);
        if (!group || !group.memberIds || !group.memberIds.length) return [];

        const allActors = await this.getAllActors();
        return allActors
            .filter((a) => group.memberIds.includes(a.id))
            .sort((a, b) => a.name.localeCompare(b.name));
    },

    async assignGroupRotation(choreId, groupId, startMemberId, startDayIndex) {
        const members = await this.getGroupMembers(groupId);
        if (!members.length) return;

        const startIdx = members.findIndex((m) => m.id === startMemberId);
        if (startIdx === -1) return;

        for (let i = 0; i < 7; i++) {
            const dayIndex = (startDayIndex + i) % 7;
            const memberIndex = (startIdx + i) % members.length;
            await this.setAssignment(choreId, dayIndex, members[memberIndex].id);
        }
    },

    async canAddMember(groupId, memberId) {
        if (groupId === memberId) return false;

        const isDesc = await this.isDescendant(memberId, groupId);
        if (isDesc) return false;

        const isValid = await this.isValidDepth(groupId, memberId);
        if (!isValid) return false;

        return true;
    },

    async isDescendant(parentId, targetId) {
        const members = await this.getGroupMembers(parentId);
        for (const m of members) {
            if (m.id === targetId) return true;
            if (m.type === 'group') {
                const childDesc = await this.isDescendant(m.id, targetId);
                if (childDesc) return true;
            }
        }
        return false;
    },

    async isValidDepth(parentId, newMemberId, maxLevel = 3) {
        const childDepth = await this.getGroupDepth(newMemberId);
        const parentHeight = await this.getGroupHeight(parentId);
        return parentHeight + childDepth < maxLevel;
    },

    async getGroupDepth(id) {
        const allActors = await this.getAllActors();
        const actor = allActors.find((a) => a.id === id);
        if (!actor || actor.type !== 'group') return 0;

        const members = await this.getGroupMembers(id);
        const groupMembers = members.filter((m) => m.type === 'group');
        if (groupMembers.length === 0) return 1;

        const depths = await Promise.all(groupMembers.map((m) => this.getGroupDepth(m.id)));
        return 1 + Math.max(...depths);
    },

    async getGroupHeight(id) {
        const groups = await this.getAllGroups();
        const parents = groups.filter((g) => g.memberIds.includes(id));
        if (parents.length === 0) return 1;

        const heights = await Promise.all(parents.map((p) => this.getGroupHeight(p.id)));
        return 1 + Math.max(...heights);
    },

    // ── Chores ──────────────────────────────────────────────

    async getAllChores() {
        const rows = await dbQuery(
            'SELECT id, name, sort_order FROM chores ORDER BY sort_order, id'
        );
        return rows.map((row) => ({
            id: row.id,
            name: row.name,
            sortOrder: row.sort_order
        }));
    },

    async addChore(name) {
        const maxOrderRow = await dbQuery(
            'SELECT COALESCE(MAX(sort_order), 0) as max_val FROM chores'
        );
        const nextOrder = maxOrderRow[0].max_val + 1;
        const res = await dbExecute('INSERT INTO chores (name, sort_order) VALUES (?, ?)', [
            name,
            nextOrder
        ]);
        return res ? res.lastID : null;
    },

    async removeChore(id) {
        await dbExecute('DELETE FROM assignments WHERE chore_id = ?', [id]);
        await dbExecute('DELETE FROM chores WHERE id = ?', [id]);
    },

    async updateChore(id, fields) {
        const sets = [];
        const params = [];
        if (fields.name !== undefined) {
            sets.push('name = ?');
            params.push(fields.name);
        }
        if (fields.sortOrder !== undefined) {
            sets.push('sort_order = ?');
            params.push(fields.sortOrder);
        }
        if (!sets.length) return;
        params.push(id);
        await dbExecute(`UPDATE chores SET ${sets.join(', ')} WHERE id = ?`, params);
    },

    async updateChoreOrders(orderedIds) {
        for (let i = 0; i < orderedIds.length; i++) {
            await dbExecute('UPDATE chores SET sort_order = ? WHERE id = ?', [
                i + 1,
                orderedIds[i]
            ]);
        }
    },

    // ── Assignments ─────────────────────────────────────────

    async getAllAssignments() {
        const rows = await dbQuery(`
            SELECT a.chore_id, a.day_index, a.actor_id,
                   ac.name, ac.initials, ac.color, ac.type
            FROM assignments a
            JOIN actors ac ON a.actor_id = ac.id
            ORDER BY a.id
        `);

        const map = {};
        for (const row of rows) {
            const key = `${row.chore_id}-${row.day_index}`;
            if (!map[key]) map[key] = [];
            map[key].push({
                actorId: row.actor_id,
                name: row.name,
                initials: row.initials,
                color: row.color,
                type: row.type
            });
        }
        return map;
    },

    async addAssignment(choreId, dayIndex, actorId) {
        const max = await this.getMaxMarkersPerCell();

        const countRow = await dbQuery(
            'SELECT COUNT(*) as count FROM assignments WHERE chore_id = ? AND day_index = ?',
            [choreId, dayIndex]
        );
        const count = countRow[0].count;
        if (count >= max) return false;

        const dupRow = await dbQuery(
            'SELECT COUNT(*) as count FROM assignments WHERE chore_id = ? AND day_index = ? AND actor_id = ?',
            [choreId, dayIndex, actorId]
        );
        if (dupRow[0].count > 0) return false;

        await dbExecute(
            'INSERT INTO assignments (chore_id, day_index, actor_id) VALUES (?, ?, ?)',
            [choreId, dayIndex, actorId]
        );
        return true;
    },

    async removeAssignment(choreId, dayIndex, actorId) {
        await dbExecute(
            'DELETE FROM assignments WHERE chore_id = ? AND day_index = ? AND actor_id = ?',
            [choreId, dayIndex, actorId]
        );
    },

    async setAssignment(choreId, dayIndex, actorId) {
        await dbExecute('DELETE FROM assignments WHERE chore_id = ? AND day_index = ?', [
            choreId,
            dayIndex
        ]);
        await dbExecute(
            'INSERT INTO assignments (chore_id, day_index, actor_id) VALUES (?, ?, ?)',
            [choreId, dayIndex, actorId]
        );
    },

    async clearAssignment(choreId, dayIndex) {
        await dbExecute('DELETE FROM assignments WHERE chore_id = ? AND day_index = ?', [
            choreId,
            dayIndex
        ]);
    },

    async clearAllAssignments() {
        await dbExecute('DELETE FROM assignments');
    },

    // ── Settings ────────────────────────────────────────────

    async getSetting(key) {
        const rows = await dbQuery('SELECT value FROM settings WHERE key = ?', [key]);
        if (rows.length === 0) return null;
        return rows[0].value;
    },

    async setSetting(key, value) {
        await dbExecute(
            `
            INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `,
            [key, value]
        );
    },

    async getWeekStartDay() {
        const val = await this.getSetting('week_start_day');
        return val || 'Mon';
    },

    async setWeekStartDay(day) {
        await this.setSetting('week_start_day', day);
    },

    async getMaxMarkersPerCell() {
        const val = await this.getSetting('max_markers_per_cell');
        const n = parseInt(val, 10);
        return isNaN(n) ? 2 : Math.max(0, Math.min(32, n));
    },

    async setMaxMarkersPerCell(n) {
        const clamped = Math.max(0, Math.min(32, parseInt(n, 10) || 2));
        await this.setSetting('max_markers_per_cell', String(clamped));
    },

    async getRowShadingEnabled() {
        const val = await this.getSetting('row_shading_enabled');
        return val === 'true';
    },

    async setRowShadingEnabled(enabled) {
        await this.setSetting('row_shading_enabled', String(enabled));
    },

    async getRowShadingColor() {
        const val = await this.getSetting('row_shading_color');
        return val || '#f8f9fa';
    },

    async setRowShadingColor(color) {
        await this.setSetting('row_shading_color', color);
    },

    async getChoreColumnWidth() {
        const val = await this.getSetting('chore_col_width');
        const w = parseInt(val, 10);
        return isNaN(w) ? 200 : w;
    },

    async setChoreColumnWidth(width) {
        await this.setSetting('chore_col_width', width);
    }
};
