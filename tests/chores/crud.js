describe('Chore CRUD & Reordering', () => {
    beforeEach(async () => {
        await createSchema();
    });

    it('getAllChores() returns seeded chores in sort order', async () => {
        const chores = await ChoreRepository.getAllChores();
        expect(chores.length).toBe(4);
        expect(chores[0].name).toBe('Dishes');
        expect(chores[1].name).toBe('Laundry');
        expect(chores[2].name).toBe('Vacuuming');
        expect(chores[3].name).toBe('Trash');
    });

    it('addChore() adds chore with incrementing sort order', async () => {
        await ChoreRepository.addChore('Cooking');
        const chores = await ChoreRepository.getAllChores();
        expect(chores.length).toBe(5);
        const cooking = chores[4];
        expect(cooking.name).toBe('Cooking');
        expect(cooking.sortOrder).toBe(5);
    });

    it('removeChore() deletes chore', async () => {
        const chores = await ChoreRepository.getAllChores();
        await ChoreRepository.removeChore(chores[0].id);
        const remaining = await ChoreRepository.getAllChores();
        expect(remaining.length).toBe(3);
    });

    it('removeChore() also deletes assignments for that chore', async () => {
        const chores = await ChoreRepository.getAllChores();
        const people = await ChoreRepository.getAllPeople();
        await ChoreRepository.setAssignment(chores[0].id, 0, people[0].id);
        await ChoreRepository.removeChore(chores[0].id);
        const assignments = await ChoreRepository.getAllAssignments();
        expect(Object.keys(assignments).length).toBe(0);
    });

    it('updateChore() should update chore name', async () => {
        const chores = await ChoreRepository.getAllChores();
        const id = chores[0].id;
        await ChoreRepository.updateChore(id, { name: 'Clean Windows' });

        const result = await ChoreRepository.getAllChores();
        const updated = result.find((c) => c.id === id);
        expect(updated.name).toBe('Clean Windows');
    });

    it('updateChore() should update sortOrder', async () => {
        const chores = await ChoreRepository.getAllChores();
        const id = chores[0].id;
        await ChoreRepository.updateChore(id, { sortOrder: 99 });

        const result = await ChoreRepository.getAllChores();
        const updated = result.find((c) => c.id === id);
        expect(updated.sortOrder).toBe(99);
    });

    it('updateChoreOrders() should update sort_order in database', async () => {
        const chores = await ChoreRepository.getAllChores();
        const originalIds = chores.map((c) => c.id);
        const reorderedIds = [originalIds[1], originalIds[0], ...originalIds.slice(2)];

        await ChoreRepository.updateChoreOrders(reorderedIds);

        const updatedChores = await ChoreRepository.getAllChores();
        expect(updatedChores[0].id).toBe(reorderedIds[0]);
        expect(updatedChores[1].id).toBe(reorderedIds[1]);
        expect(updatedChores[0].sortOrder).toBe(1);
        expect(updatedChores[1].sortOrder).toBe(2);
    });

    it('should be able to sort chores alphabetically (A-Z and Z-A)', async () => {
        // Clear and add specific chores
        await dbExecute('DELETE FROM chores');
        await dbExecute('DELETE FROM assignments');
        await ChoreRepository.addChore('Zebra');
        await ChoreRepository.addChore('Apple');
        await ChoreRepository.addChore('Banana');

        let chores = await ChoreRepository.getAllChores();

        // Ascending sort
        chores.sort((a, b) => a.name.localeCompare(b.name));
        await ChoreRepository.updateChoreOrders(chores.map((c) => c.id));
        let result = await ChoreRepository.getAllChores();
        expect(result[0].name).toBe('Apple');
        expect(result[2].name).toBe('Zebra');

        // Descending sort
        chores.sort((a, b) => b.name.localeCompare(a.name));
        await ChoreRepository.updateChoreOrders(chores.map((c) => c.id));
        result = await ChoreRepository.getAllChores();
        expect(result[0].name).toBe('Zebra');
        expect(result[2].name).toBe('Apple');
    });
});
