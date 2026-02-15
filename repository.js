/**
 * repository.js - Data Access Layer (Repository Pattern)
 * 
 * This is the ONLY layer that touches the database.
 * The rest of the app calls these functions.
 * 
 * When migrating to Postgres/MySQL, replace these implementations
 * with fetch() calls to a REST API — the function signatures stay identical.
 */

const ChoreRepository = {
    // ── People ──────────────────────────────────────────────

    getAllPeople() {
        const db = getDb();
        const result = db.exec("SELECT id, name, initials, color FROM people ORDER BY id");
        if (!result.length) return [];
        return result[0].values.map(row => ({
            id: row[0], name: row[1], initials: row[2], color: row[3]
        }));
    },

    addPerson(name, initials, color) {
        const db = getDb();
        db.run("INSERT INTO people (name, initials, color) VALUES (?, ?, ?)", [name, initials, color]);
        saveDatabase();
    },

    removePerson(id) {
        const db = getDb();
        db.run("DELETE FROM assignments WHERE person_id = ?", [id]);
        db.run("DELETE FROM people WHERE id = ?", [id]);
        saveDatabase();
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

    // ── Assignments ─────────────────────────────────────────

    getAllAssignments() {
        const db = getDb();
        const result = db.exec(`
            SELECT a.chore_id, a.day_index, a.person_id,
                   p.name, p.initials, p.color
            FROM assignments a
            JOIN people p ON a.person_id = p.id
        `);
        if (!result.length) return {};

        const map = {};
        result[0].values.forEach(row => {
            const key = `${row[0]}-${row[1]}`;
            map[key] = {
                personId: row[2],
                name: row[3],
                initials: row[4],
                color: row[5]
            };
        });
        return map;
    },

    setAssignment(choreId, dayIndex, personId) {
        const db = getDb();
        db.run(`
            INSERT INTO assignments (chore_id, day_index, person_id)
            VALUES (?, ?, ?)
            ON CONFLICT(chore_id, day_index) DO UPDATE SET person_id = excluded.person_id
        `, [choreId, dayIndex, personId]);
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
    }
};
