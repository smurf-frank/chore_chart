/**
 * db.js - Database Initialization & Schema
 *
 * Uses sql.js (SQLite compiled to WebAssembly) for local persistence in browser,
 * and @capacitor-community/sqlite for native Android.
 */

const DB_NAME = 'chore_chart_db';

// _db holds the platform-specific database object
// For web: { isNative: false, client: SQL.Database }
// For native: { isNative: true, plugin: CapacitorSQLite }
let _db = null;

/**
 * Initialize the database. Loads sql.js WASM or connects to Capacitor SQLite,
 * creates or restores the DB, and ensures all tables exist.
 */
async function initDatabase() {
    if (_db) return _db;

    if (StorageStrategy.isNative()) {
        const sqlite = window.Capacitor.Plugins.CapacitorSQLite;
        await sqlite.createConnection({
            database: DB_NAME,
            encrypted: false,
            mode: 'no-encryption',
            version: 1,
            readonly: false
        });
        await sqlite.open({ database: DB_NAME, readonly: false });
        _db = { isNative: true, plugin: sqlite };
    } else {
        const SQL = await initSqlJs({
            locateFile: (file) => `vendor/${file}`
        });

        // Try to restore from localStorage
        const savedData = localStorage.getItem(DB_NAME);
        if (savedData) {
            const buf = Uint8Array.from(atob(savedData), (c) => c.charCodeAt(0));
            _db = { isNative: false, client: new SQL.Database(buf) };
        } else {
            _db = { isNative: false, client: new SQL.Database() };
        }
    }

    // Run migrations / ensure schema
    await createSchema();
    await migrateToActors();
    // duplicate call intentional? previous code had it twice, let's just keep one
    await migrateMultiAssign();
    await seedVisualSettings();

    return _db;
}

/**
 * Execute a SQL query that does not return row data (INSERT, UPDATE, DELETE).
 * @param {string} sql
 * @param {Array} params
 */
async function dbExecute(sql, params = []) {
    if (!_db) return;
    if (_db.isNative) {
        return await _db.plugin.run({ database: DB_NAME, statement: sql, values: params });
    } else {
        const res = _db.client.run(sql, params);
        saveDatabase();
        return res;
    }
}

/**
 * Execute a SQL query and return the rows as an array of objects.
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Array<Object>>}
 */
async function dbQuery(sql, params = []) {
    if (!_db) return [];
    if (_db.isNative) {
        const res = await _db.plugin.query({ database: DB_NAME, statement: sql, values: params });
        return res.values || [];
    } else {
        const res = _db.client.exec(sql, params);
        if (!res.length) return [];
        const columns = res[0].columns;
        return res[0].values.map((row) => {
            const obj = {};
            columns.forEach((col, i) => (obj[col] = row[i]));
            return obj;
        });
    }
}

/**
 * Create the database schema.
 */
async function createSchema() {
    await dbExecute(`
        CREATE TABLE IF NOT EXISTS actors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL DEFAULT 'person',
            name TEXT NOT NULL,
            initials TEXT NOT NULL,
            color TEXT NOT NULL,
            metadata TEXT DEFAULT '{}'
        );
    `);

    await dbExecute(`
        CREATE TABLE IF NOT EXISTS chores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0
        );
    `);

    await dbExecute(`
        CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chore_id INTEGER NOT NULL,
            day_index INTEGER NOT NULL,
            actor_id INTEGER NOT NULL,
            FOREIGN KEY (chore_id) REFERENCES chores(id) ON DELETE CASCADE,
            FOREIGN KEY (actor_id) REFERENCES actors(id) ON DELETE CASCADE,
            UNIQUE(chore_id, day_index, actor_id)
        );
    `);

    await dbExecute(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `);

    // Seed default actors if table is empty
    const actors = await dbQuery('SELECT COUNT(*) as count FROM actors');
    if (actors[0].count === 0) {
        await dbExecute(
            "INSERT INTO actors (type, name, initials, color) VALUES ('person', 'User 1', 'U1', '#0084ff')"
        );
        await dbExecute(
            "INSERT INTO actors (type, name, initials, color) VALUES ('person', 'User 2', 'U2', '#ff4d4d')"
        );
        await dbExecute(
            "INSERT INTO actors (type, name, initials, color) VALUES ('person', 'User 3', 'U3', '#2ecc71')"
        );
    }

    const chores = await dbQuery('SELECT COUNT(*) as count FROM chores');
    if (chores[0].count === 0) {
        await dbExecute("INSERT INTO chores (name, sort_order) VALUES ('Dishes', 1)");
        await dbExecute("INSERT INTO chores (name, sort_order) VALUES ('Laundry', 2)");
        await dbExecute("INSERT INTO chores (name, sort_order) VALUES ('Vacuuming', 3)");
        await dbExecute("INSERT INTO chores (name, sort_order) VALUES ('Trash', 4)");
    }

    // Seed default settings
    const settings = await dbQuery('SELECT COUNT(*) as count FROM settings');
    if (settings[0].count === 0) {
        await dbExecute("INSERT INTO settings (key, value) VALUES ('week_start_day', 'Mon')");
        await dbExecute("INSERT INTO settings (key, value) VALUES ('chart_title', 'Chore Chart')");
        await dbExecute(
            "INSERT INTO settings (key, value) VALUES ('chart_subtitle', 'Digital Magnetic Board')"
        );
        await dbExecute("INSERT INTO settings (key, value) VALUES ('max_markers_per_cell', '2')");
    }
}

/**
 * Migrate legacy 'people' table data into 'actors' table.
 */
async function migrateToActors() {
    // Check if legacy 'people' table exists
    const tables = await dbQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='people'"
    );
    if (tables.length === 0) return;

    // Copy people → actors
    const actors = await dbQuery('SELECT COUNT(*) as count FROM actors');
    if (actors[0].count === 0) {
        await dbExecute(`
            INSERT INTO actors (id, type, name, initials, color)
            SELECT id, 'person', name, initials, color FROM people
        `);
    }

    // Check assignments person_id
    const cols = await dbQuery('PRAGMA table_info(assignments)');
    const hasPersonId = cols.some((row) => row.name === 'person_id');
    if (hasPersonId) {
        await dbExecute(`CREATE TABLE IF NOT EXISTS assignments_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chore_id INTEGER NOT NULL,
            day_index INTEGER NOT NULL,
            actor_id INTEGER NOT NULL,
            FOREIGN KEY (chore_id) REFERENCES chores(id) ON DELETE CASCADE,
            FOREIGN KEY (actor_id) REFERENCES actors(id) ON DELETE CASCADE,
            UNIQUE(chore_id, day_index, actor_id)
        )`);
        await dbExecute(`INSERT INTO assignments_new (id, chore_id, day_index, actor_id)
                 SELECT id, chore_id, day_index, person_id FROM assignments`);
        await dbExecute('DROP TABLE assignments');
        await dbExecute('ALTER TABLE assignments_new RENAME TO assignments');
    }

    await dbExecute('DROP TABLE IF EXISTS people');
}

/**
 * Migrate single-assignment constraint to multi-assignment.
 */
async function migrateMultiAssign() {
    const tableSql = await dbQuery(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='assignments'"
    );
    if (!tableSql.length) return;
    const createSql = tableSql[0].sql;

    if (
        createSql.includes('UNIQUE(chore_id, day_index, actor_id)') ||
        createSql.includes('UNIQUE (chore_id, day_index, actor_id)')
    )
        return;

    await dbExecute(`CREATE TABLE assignments_multi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chore_id INTEGER NOT NULL,
        day_index INTEGER NOT NULL,
        actor_id INTEGER NOT NULL,
        FOREIGN KEY (chore_id) REFERENCES chores(id) ON DELETE CASCADE,
        FOREIGN KEY (actor_id) REFERENCES actors(id) ON DELETE CASCADE,
        UNIQUE(chore_id, day_index, actor_id)
    )`);
    await dbExecute(`INSERT INTO assignments_multi (id, chore_id, day_index, actor_id)
             SELECT id, chore_id, day_index, actor_id FROM assignments`);
    await dbExecute('DROP TABLE assignments');
    await dbExecute('ALTER TABLE assignments_multi RENAME TO assignments');

    const existing = await dbQuery("SELECT value FROM settings WHERE key = 'max_markers_per_cell'");
    if (existing.length === 0) {
        await dbExecute("INSERT INTO settings (key, value) VALUES ('max_markers_per_cell', '2')");
    }
}

/**
 * Ensure visual settings exist.
 */
async function seedVisualSettings() {
    const defaultColor = '#f8f9fa';

    const enabled = await dbQuery("SELECT value FROM settings WHERE key = 'row_shading_enabled'");
    if (enabled.length === 0) {
        await dbExecute(
            "INSERT INTO settings (key, value) VALUES ('row_shading_enabled', 'false')"
        );
    }

    const color = await dbQuery("SELECT value FROM settings WHERE key = 'row_shading_color'");
    if (color.length === 0) {
        await dbExecute("INSERT INTO settings (key, value) VALUES ('row_shading_color', ?)", [
            defaultColor
        ]);
    }

    const choreColWidth = await dbQuery("SELECT value FROM settings WHERE key = 'chore_col_width'");
    if (choreColWidth.length === 0) {
        await dbExecute("INSERT INTO settings (key, value) VALUES ('chore_col_width', '200')");
    }
}

/**
 * Persist the current database state to localStorage.
 * Automatically called by dbExecute when needed.
 */
function saveDatabase() {
    if (!_db || _db.isNative) return;
    const data = _db.client.export();
    const base64 = btoa(String.fromCharCode(...data));
    localStorage.setItem(DB_NAME, base64);
}

// Removing getDb() since we now export dbQuery and dbExecute natively
