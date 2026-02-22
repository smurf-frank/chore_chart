describe('Migration: people → actors', () => {
    beforeEach(async () => {
        localStorage.removeItem('chore_chart_db');
        const SQL = await window.initSqlJs({ locateFile: file => `vendor/${file}` });
        _db = { isNative: false, client: new SQL.Database() };
    });

    it('migrates legacy people table to actors', async () => {
        // Simulate legacy schema
        await dbExecute(`CREATE TABLE people (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            initials TEXT NOT NULL,
            color TEXT NOT NULL
        )`);
        await dbExecute("INSERT INTO people (name, initials, color) VALUES ('Alice', 'AL', '#aaa')");
        await dbExecute("INSERT INTO people (name, initials, color) VALUES ('Bob', 'BO', '#bbb')");

        await dbExecute(`CREATE TABLE chores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0
        )`);
        await dbExecute("INSERT INTO chores (name, sort_order) VALUES ('Dishes', 1)");

        await dbExecute(`CREATE TABLE assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chore_id INTEGER NOT NULL,
            day_index INTEGER NOT NULL,
            person_id INTEGER NOT NULL,
            UNIQUE(chore_id, day_index)
        )`);
        await dbExecute("INSERT INTO assignments (chore_id, day_index, person_id) VALUES (1, 0, 1)");

        await dbExecute(`CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);

        // Run migration
        await dbExecute(`CREATE TABLE IF NOT EXISTS actors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL DEFAULT 'person',
            name TEXT NOT NULL,
            initials TEXT NOT NULL,
            color TEXT NOT NULL,
            metadata TEXT DEFAULT '{}'
        )`);

        await migrateToActors();

        // Verify actors created
        const actors = _db.client.exec("SELECT * FROM actors ORDER BY id");
        expect(actors[0].values.length).toBe(2);
        expect(actors[0].values[0][1]).toBe('person'); // type
        expect(actors[0].values[0][2]).toBe('Alice');

        // Verify assignments migrated to actor_id
        const cols = _db.client.exec("PRAGMA table_info(assignments)");
        const colNames = cols[0].values.map(r => r[1]);
        expect(colNames.indexOf('actor_id') !== -1).toBe(true);

        // Verify people table dropped
        const tables = _db.client.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='people'");
        expect(tables.length === 0 || tables[0].values.length === 0).toBe(true);
    });

    it('migrateToActors is idempotent (no people table = no-op)', async () => {
        await createSchema();
        const countBefore = _db.client.exec("SELECT COUNT(*) FROM actors")[0].values[0][0];
        await migrateToActors();
        const countAfter = _db.client.exec("SELECT COUNT(*) FROM actors")[0].values[0][0];
        expect(countAfter).toBe(countBefore);
    });
});
