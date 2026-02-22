describe('Database Schema & Seeding', () => {
    beforeEach(async () => {
        await createSchema();
    });

    it('should create core tables (actors, chores, assignments, settings)', () => {
        const tables = _db.client.exec(
            "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('actors', 'chores', 'assignments', 'settings')"
        );
        // sqlite_master might return them in different order, but there should be 4
        expect(tables[0].values.length).toBe(4);
    });

    it('seeds default actors and chores via repository', async () => {
        const people = await ChoreRepository.getAllPeople();
        expect(people.length).toBe(3);

        const chores = await ChoreRepository.getAllChores();
        expect(chores.length).toBe(4);
    });

    it('should seed actors as type "person"', () => {
        const types = _db.client.exec('SELECT DISTINCT type FROM actors')[0].values;
        expect(types.length).toBe(1);
        expect(types[0][0]).toBe('person');
    });

    it('seeds default settings accurately', async () => {
        const title = await ChoreRepository.getSetting('chart_title');
        expect(title).toBe('Chore Chart');

        const maxCells = await ChoreRepository.getMaxMarkersPerCell();
        expect(maxCells).toBe(2);
    });

    it('should not re-seed if data exists', async () => {
        await createSchema(); // run again
        const count = _db.client.exec('SELECT COUNT(*) FROM actors')[0].values[0][0];
        expect(count).toBe(3); // not 6
    });

    it('actors table should have metadata column', () => {
        const cols = _db.client.exec('PRAGMA table_info(actors)');
        const colNames = cols[0].values.map((r) => r[1]);
        expect(colNames.includes('metadata')).toBe(true);
    });

    it('assignments table should use actor_id (not person_id)', () => {
        const cols = _db.client.exec('PRAGMA table_info(assignments)');
        const colNames = cols[0].values.map((r) => r[1]);
        expect(colNames.includes('actor_id')).toBe(true);
    });

    it('orders days correctly based on week_start_day', async () => {
        await ChoreRepository.setWeekStartDay('Mon');
        let days = await getOrderedDays();
        expect(days[0]).toBe('Mon');
        expect(days[6]).toBe('Sun');

        await ChoreRepository.setWeekStartDay('Sun');
        days = await getOrderedDays();
        expect(days[0]).toBe('Sun');
    });
});
