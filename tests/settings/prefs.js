describe('Settings/Preferences', () => {
    beforeEach(async () => {
        await createSchema();
    });

    it('getSetting() returns seeded value', async () => {
        const val = await ChoreRepository.getSetting('week_start_day');
        expect(val).toBe('Mon');
    });

    it('getSetting() returns null for unknown key', async () => {
        const val = await ChoreRepository.getSetting('nonexistent');
        expect(val).toBe(null);
    });

    it('setSetting() creates new setting', async () => {
        await ChoreRepository.setSetting('theme', 'dark');
        const val = await ChoreRepository.getSetting('theme');
        expect(val).toBe('dark');
    });

    it('setSetting() upserts existing setting', async () => {
        await ChoreRepository.setSetting('week_start_day', 'Sun');
        const val = await ChoreRepository.getSetting('week_start_day');
        expect(val).toBe('Sun');
    });

    it('getWeekStartDay() returns default "Mon"', async () => {
        const val = await ChoreRepository.getWeekStartDay();
        expect(val).toBe('Mon');
    });

    it('setWeekStartDay() persists value', async () => {
        await ChoreRepository.setWeekStartDay('Sun');
        const val = await ChoreRepository.getWeekStartDay();
        expect(val).toBe('Sun');
    });

    it('chart_title default is "Chore Chart"', async () => {
        const val = await ChoreRepository.getSetting('chart_title');
        expect(val).toBe('Chore Chart');
    });

    it('chart_subtitle default is "Digital Magnetic Board"', async () => {
        const val = await ChoreRepository.getSetting('chart_subtitle');
        expect(val).toBe('Digital Magnetic Board');
    });

    it('getMaxMarkersPerCell() returns default 2', async () => {
        const val = await ChoreRepository.getMaxMarkersPerCell();
        expect(val).toBe(2);
    });

    it('setMaxMarkersPerCell() updates setting', async () => {
        await ChoreRepository.setMaxMarkersPerCell(5);
        const val = await ChoreRepository.getMaxMarkersPerCell();
        expect(val).toBe(5);
    });

    it('getChoreColumnWidth() returns default 200', async () => {
        const val = await ChoreRepository.getChoreColumnWidth();
        expect(val).toBe(200);
    });

    it('setChoreColumnWidth() updates setting', async () => {
        await ChoreRepository.setChoreColumnWidth(350);
        const val = await ChoreRepository.getChoreColumnWidth();
        expect(val).toBe(350);
    });

    it('setMaxMarkersPerCell() clamps to 0-32', async () => {
        await ChoreRepository.setMaxMarkersPerCell(50);
        let val = await ChoreRepository.getMaxMarkersPerCell();
        expect(val).toBe(32);

        await ChoreRepository.setMaxMarkersPerCell(-5);
        val = await ChoreRepository.getMaxMarkersPerCell();
        expect(val).toBe(0);

        await ChoreRepository.setMaxMarkersPerCell(10);
        val = await ChoreRepository.getMaxMarkersPerCell();
        expect(val).toBe(10);
    });
});
