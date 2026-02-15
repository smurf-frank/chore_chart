/**
 * db.js - Database Initialization & Schema
 * 
 * Uses sql.js (SQLite compiled to WebAssembly) for local persistence.
 * The schema is designed to be portable to Postgres/MySQL with minimal changes.
 */

const DB_NAME = 'chore_chart_db';

let _db = null;

/**
 * Initialize the database. Loads sql.js WASM, creates or restores the DB,
 * and ensures all tables exist.
 * @returns {Promise<Database>} The sql.js Database instance
 */
async function initDatabase() {
    if (_db) return _db;

    const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
    });

    // Try to restore from localStorage
    const savedData = localStorage.getItem(DB_NAME);
    if (savedData) {
        const buf = Uint8Array.from(atob(savedData), c => c.charCodeAt(0));
        _db = new SQL.Database(buf);
    } else {
        _db = new SQL.Database();
    }

    // Run migrations / ensure schema
    createSchema(_db);
    migrateToActors(_db);

    return _db;
}

/**
 * Create the database schema.
 * Standard SQL — transfers to Postgres/MySQL with minimal type changes.
 */
function createSchema(db) {
    // Polymorphic actors table (replaces old 'people' table)
    // Supports: person, group, ai_agent, webhook, chore_chart
    db.run(`
        CREATE TABLE IF NOT EXISTS actors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL DEFAULT 'person',
            name TEXT NOT NULL,
            initials TEXT NOT NULL,
            color TEXT NOT NULL,
            metadata TEXT DEFAULT '{}'
        );
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS chores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0
        );
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chore_id INTEGER NOT NULL,
            day_index INTEGER NOT NULL,
            actor_id INTEGER NOT NULL,
            FOREIGN KEY (chore_id) REFERENCES chores(id) ON DELETE CASCADE,
            FOREIGN KEY (actor_id) REFERENCES actors(id) ON DELETE CASCADE,
            UNIQUE(chore_id, day_index)
        );
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `);

    // Seed default actors if table is empty
    const actorCount = db.exec("SELECT COUNT(*) FROM actors")[0].values[0][0];
    if (actorCount === 0) {
        db.run("INSERT INTO actors (type, name, initials, color) VALUES ('person', 'User 1', 'U1', '#0084ff')");
        db.run("INSERT INTO actors (type, name, initials, color) VALUES ('person', 'User 2', 'U2', '#ff4d4d')");
        db.run("INSERT INTO actors (type, name, initials, color) VALUES ('person', 'User 3', 'U3', '#2ecc71')");
    }

    const choreCount = db.exec("SELECT COUNT(*) FROM chores")[0].values[0][0];
    if (choreCount === 0) {
        db.run("INSERT INTO chores (name, sort_order) VALUES ('Dishes', 1)");
        db.run("INSERT INTO chores (name, sort_order) VALUES ('Laundry', 2)");
        db.run("INSERT INTO chores (name, sort_order) VALUES ('Vacuuming', 3)");
        db.run("INSERT INTO chores (name, sort_order) VALUES ('Trash', 4)");
    }

    // Seed default settings
    const settingsCount = db.exec("SELECT COUNT(*) FROM settings")[0].values[0][0];
    if (settingsCount === 0) {
        db.run("INSERT INTO settings (key, value) VALUES ('week_start_day', 'Mon')");
        db.run("INSERT INTO settings (key, value) VALUES ('chart_title', 'Chore Chart')");
        db.run("INSERT INTO settings (key, value) VALUES ('chart_subtitle', 'Digital Magnetic Board')");
    }
}

/**
 * Migrate legacy 'people' table data into 'actors' table.
 * Safe to run multiple times — only acts if 'people' table still exists.
 */
function migrateToActors(db) {
    // Check if legacy 'people' table exists
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='people'");
    if (!tables.length || !tables[0].values.length) return;

    // Copy people → actors (only if actors is empty, meaning fresh migration)
    const actorCount = db.exec("SELECT COUNT(*) FROM actors")[0].values[0][0];
    if (actorCount === 0) {
        db.run(`
            INSERT INTO actors (id, type, name, initials, color)
            SELECT id, 'person', name, initials, color FROM people
        `);
    }

    // Migrate assignments: person_id → actor_id
    // Check if old 'assignments' table has 'person_id' column
    const cols = db.exec("PRAGMA table_info(assignments)");
    if (cols.length) {
        const hasPersonId = cols[0].values.some(row => row[1] === 'person_id');
        if (hasPersonId) {
            // Recreate assignments with actor_id
            db.run(`CREATE TABLE IF NOT EXISTS assignments_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chore_id INTEGER NOT NULL,
                day_index INTEGER NOT NULL,
                actor_id INTEGER NOT NULL,
                FOREIGN KEY (chore_id) REFERENCES chores(id) ON DELETE CASCADE,
                FOREIGN KEY (actor_id) REFERENCES actors(id) ON DELETE CASCADE,
                UNIQUE(chore_id, day_index)
            )`);
            db.run(`INSERT INTO assignments_new (id, chore_id, day_index, actor_id)
                     SELECT id, chore_id, day_index, person_id FROM assignments`);
            db.run("DROP TABLE assignments");
            db.run("ALTER TABLE assignments_new RENAME TO assignments");
        }
    }

    // Drop legacy table
    db.run("DROP TABLE IF EXISTS people");
    saveDatabase();
}

/**
 * Persist the current database state to localStorage.
 * Call this after every write operation.
 */
function saveDatabase() {
    if (!_db) return;
    const data = _db.export();
    const base64 = btoa(String.fromCharCode(...data));
    localStorage.setItem(DB_NAME, base64);
}

/**
 * Get the active database instance.
 * @returns {Database}
 */
function getDb() {
    return _db;
}
