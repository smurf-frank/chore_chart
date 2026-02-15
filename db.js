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

    return _db;
}

/**
 * Create the database schema.
 * Standard SQL — transfers to Postgres/MySQL with minimal type changes.
 */
function createSchema(db) {
    db.run(`
        CREATE TABLE IF NOT EXISTS people (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            initials TEXT NOT NULL,
            color TEXT NOT NULL
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
            person_id INTEGER NOT NULL,
            FOREIGN KEY (chore_id) REFERENCES chores(id) ON DELETE CASCADE,
            FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
            UNIQUE(chore_id, day_index)
        );
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `);

    // Seed default data if tables are empty
    const peopleCount = db.exec("SELECT COUNT(*) FROM people")[0].values[0][0];
    if (peopleCount === 0) {
        db.run("INSERT INTO people (name, initials, color) VALUES ('User 1', 'U1', '#0084ff')");
        db.run("INSERT INTO people (name, initials, color) VALUES ('User 2', 'U2', '#ff4d4d')");
        db.run("INSERT INTO people (name, initials, color) VALUES ('User 3', 'U3', '#2ecc71')");
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
