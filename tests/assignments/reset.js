describe('Assignment Reset (clearAllAssignments)', () => {
    beforeEach(async () => {
        await createSchema();
    });

    it('clears all assignments across all chores and days', async () => {
        const people = await ChoreRepository.getAllPeople();
        const chores = await ChoreRepository.getAllChores();
        // Fill every chore with an assignment on multiple days
        for (let i = 0; i < chores.length; i++) {
            await ChoreRepository.setAssignment(chores[i].id, 0, people[0].id);
            await ChoreRepository.setAssignment(chores[i].id, 1, people[1].id);
            await ChoreRepository.setAssignment(chores[i].id, 2, people[2].id);
        }

        let assignments = await ChoreRepository.getAllAssignments();
        expect(Object.keys(assignments).length).toBe(12);

        await ChoreRepository.clearAllAssignments();

        assignments = await ChoreRepository.getAllAssignments();
        expect(Object.keys(assignments).length).toBe(0);
    });

    it('preserves all chores after reset', async () => {
        const choresBefore = await ChoreRepository.getAllChores();
        const people = await ChoreRepository.getAllPeople();
        for (let i = 0; i < choresBefore.length; i++) {
            await ChoreRepository.setAssignment(choresBefore[i].id, 0, people[0].id);
        }
        await ChoreRepository.clearAllAssignments();
        const choresAfter = await ChoreRepository.getAllChores();
        expect(choresAfter.length).toBe(choresBefore.length);
        for (let i = 0; i < choresAfter.length; i++) {
            expect(choresAfter[i].id).toBe(choresBefore[i].id);
            expect(choresAfter[i].name).toBe(choresBefore[i].name);
        }
    });

    it('preserves all people after reset', async () => {
        const peopleBefore = await ChoreRepository.getAllPeople();
        await ChoreRepository.setMaxMarkersPerCell(32);
        for (let i = 0; i < peopleBefore.length; i++) {
            await ChoreRepository.addAssignment(1, i, peopleBefore[i].id);
        }
        await ChoreRepository.clearAllAssignments();
        const peopleAfter = await ChoreRepository.getAllPeople();
        expect(peopleAfter.length).toBe(peopleBefore.length);
        for (let i = 0; i < peopleAfter.length; i++) {
            expect(peopleAfter[i].id).toBe(peopleBefore[i].id);
            expect(peopleAfter[i].name).toBe(peopleBefore[i].name);
            expect(peopleAfter[i].color).toBe(peopleBefore[i].color);
        }
    });

    it('preserves all settings after reset', async () => {
        await ChoreRepository.setSetting('chart_title', 'My House');
        await ChoreRepository.setSetting('week_start_day', 'Sun');
        const people = await ChoreRepository.getAllPeople();
        await ChoreRepository.addAssignment(1, 0, people[0].id);
        await ChoreRepository.clearAllAssignments();

        const title = await ChoreRepository.getSetting('chart_title');
        expect(title).toBe('My House');

        const weekStart = await ChoreRepository.getSetting('week_start_day');
        expect(weekStart).toBe('Sun');
    });

    it('board is assignable again after reset', async () => {
        const people = await ChoreRepository.getAllPeople();
        const chores = await ChoreRepository.getAllChores();
        await ChoreRepository.setAssignment(chores[0].id, 0, people[0].id);
        await ChoreRepository.clearAllAssignments();

        // Re-assign
        await ChoreRepository.setAssignment(chores[0].id, 0, people[1].id);
        const assignments = await ChoreRepository.getAllAssignments();
        expect(Object.keys(assignments).length).toBe(1);
        expect(assignments[`${chores[0].id}-0`][0].actorId).toBe(people[1].id);
    });

    it('is a no-op when no assignments exist', async () => {
        await ChoreRepository.clearAllAssignments();
        const assignments = await ChoreRepository.getAllAssignments();
        expect(Object.keys(assignments).length).toBe(0);
        // Should not throw or affect anything
        const chores = await ChoreRepository.getAllChores();
        expect(chores.length).toBe(4);
        const people = await ChoreRepository.getAllPeople();
        expect(people.length).toBe(3);
    });
});
