describe('Assignment CRUD & Movement', () => {
    beforeEach(async () => {
        await createSchema();
    });

    it('getAllAssignments() returns empty map initially', async () => {
        const assignments = await ChoreRepository.getAllAssignments();
        expect(Object.keys(assignments).length).toBe(0);
    });

    it('setAssignment() creates a single-item array', async () => {
        const people = await ChoreRepository.getAllPeople();
        const chores = await ChoreRepository.getAllChores();
        await ChoreRepository.setAssignment(chores[0].id, 0, people[0].id);
        const assignments = await ChoreRepository.getAllAssignments();
        const key = `${chores[0].id}-0`;
        expect(Array.isArray(assignments[key])).toBe(true);
        expect(assignments[key].length).toBe(1);
        expect(assignments[key][0].actorId).toBe(people[0].id);
        expect(assignments[key][0].initials).toBe('U1');
    });

    it('setAssignment() replaces existing (clears then sets)', async () => {
        const people = await ChoreRepository.getAllPeople();
        const chores = await ChoreRepository.getAllChores();
        await ChoreRepository.setAssignment(chores[0].id, 0, people[0].id);
        await ChoreRepository.setAssignment(chores[0].id, 0, people[1].id);
        const assignments = await ChoreRepository.getAllAssignments();
        expect(assignments[`${chores[0].id}-0`].length).toBe(1);
        expect(assignments[`${chores[0].id}-0`][0].actorId).toBe(people[1].id);
    });

    it('addAssignment() adds multiple actors to same cell', async () => {
        const people = await ChoreRepository.getAllPeople();
        const chores = await ChoreRepository.getAllChores();
        await ChoreRepository.addAssignment(chores[0].id, 0, people[0].id);
        await ChoreRepository.addAssignment(chores[0].id, 0, people[1].id);
        const assignments = await ChoreRepository.getAllAssignments();
        const key = `${chores[0].id}-0`;
        expect(assignments[key].length).toBe(2);
        expect(assignments[key][0].actorId).toBe(people[0].id);
        expect(assignments[key][1].actorId).toBe(people[1].id);
    });

    it('addAssignment() rejects duplicates in same cell', async () => {
        const people = await ChoreRepository.getAllPeople();
        const chores = await ChoreRepository.getAllChores();
        const added1 = await ChoreRepository.addAssignment(chores[0].id, 0, people[0].id);
        const added2 = await ChoreRepository.addAssignment(chores[0].id, 0, people[0].id);
        expect(added1).toBe(true);
        expect(added2).toBe(false);
        const assignments = await ChoreRepository.getAllAssignments();
        expect(assignments[`${chores[0].id}-0`].length).toBe(1);
    });

    it('restricts assignments based on max markers', async () => {
        await ChoreRepository.setMaxMarkersPerCell(1);
        const people = await ChoreRepository.getAllPeople();
        const chores = await ChoreRepository.getAllChores();

        let success = await ChoreRepository.addAssignment(chores[0].id, 0, people[0].id);
        expect(success).toBe(true);

        let success2 = await ChoreRepository.addAssignment(chores[0].id, 0, people[1].id);
        expect(success2).toBe(false); // Exceeds cap of 1

        let assignments = await ChoreRepository.getAllAssignments();
        expect(assignments[`${chores[0].id}-0`].length).toBe(1);
    });

    it('removeAssignment() removes specific actor from cell', async () => {
        const people = await ChoreRepository.getAllPeople();
        const chores = await ChoreRepository.getAllChores();
        await ChoreRepository.addAssignment(chores[0].id, 0, people[0].id);
        await ChoreRepository.addAssignment(chores[0].id, 0, people[1].id);
        await ChoreRepository.removeAssignment(chores[0].id, 0, people[0].id);
        const assignments = await ChoreRepository.getAllAssignments();
        const key = `${chores[0].id}-0`;
        expect(assignments[key].length).toBe(1);
        expect(assignments[key][0].actorId).toBe(people[1].id);
    });

    it('clearAssignment() removes all actors from cell', async () => {
        const people = await ChoreRepository.getAllPeople();
        const chores = await ChoreRepository.getAllChores();
        await ChoreRepository.addAssignment(chores[0].id, 0, people[0].id);
        await ChoreRepository.addAssignment(chores[0].id, 0, people[1].id);
        await ChoreRepository.clearAssignment(chores[0].id, 0);
        const assignments = await ChoreRepository.getAllAssignments();
        expect(assignments[`${chores[0].id}-0`]).toBe(undefined);
    });

    it('clearAllAssignments() removes everything', async () => {
        const people = await ChoreRepository.getAllPeople();
        const chores = await ChoreRepository.getAllChores();
        await ChoreRepository.addAssignment(chores[0].id, 0, people[0].id);
        await ChoreRepository.addAssignment(chores[1].id, 1, people[1].id);
        await ChoreRepository.addAssignment(chores[2].id, 2, people[2].id);
        await ChoreRepository.clearAllAssignments();
        expect(Object.keys(await ChoreRepository.getAllAssignments()).length).toBe(0);
    });

    it('assignment includes actor type in result', async () => {
        const people = await ChoreRepository.getAllPeople();
        const chores = await ChoreRepository.getAllChores();
        await ChoreRepository.addAssignment(chores[0].id, 0, people[0].id);
        const assignments = await ChoreRepository.getAllAssignments();
        expect(assignments[`${chores[0].id}-0`][0].type).toBe('person');
    });

    it('multiple chores can have assignments on the same day', async () => {
        const people = await ChoreRepository.getAllPeople();
        const chores = await ChoreRepository.getAllChores();
        await ChoreRepository.addAssignment(chores[0].id, 0, people[0].id);
        await ChoreRepository.addAssignment(chores[1].id, 0, people[1].id);
        const assignments = await ChoreRepository.getAllAssignments();
        expect(Object.keys(assignments).length).toBe(2);
    });

    it('should move assignment from one cell to another', async () => {
        await ChoreRepository.addPerson('Bob', 'BOB', '#000000');
        await ChoreRepository.addChore('Task 1');

        const people = await ChoreRepository.getAllPeople();
        const chores = await ChoreRepository.getAllChores();
        const actorId = people[0].id;
        const choreId = chores[0].id;

        // Assign to Mon (0)
        await ChoreRepository.addAssignment(choreId, 0, actorId);
        let assignments = await ChoreRepository.getAllAssignments();
        const key1 = `${choreId}-0`;
        expect(assignments[key1].length).toBe(1);

        // Move to Tue (1) manually (simulating the move logic)
        // Trigger add to new cell
        const added = await ChoreRepository.addAssignment(choreId, 1, actorId);
        expect(added).toBe(true);
        // Remove from old cell
        await ChoreRepository.removeAssignment(choreId, 0, actorId);

        assignments = await ChoreRepository.getAllAssignments();
        const key2 = `${choreId}-1`;
        expect(assignments[key1]).toBe(undefined);
        expect(assignments[key2].length).toBe(1);
        expect(assignments[key2][0].actorId).toBe(actorId);
    });

    it('should fail to move if target cell is full', async () => {
        await ChoreRepository.setMaxMarkersPerCell(1);

        const people = await ChoreRepository.getAllPeople();
        const chores = await ChoreRepository.getAllChores();
        const actor1 = people[0].id;

        await ChoreRepository.addPerson('Alice', 'ALC', '#ffffff');
        const newPeople = await ChoreRepository.getAllPeople();
        const actor2 = newPeople[newPeople.length - 1].id;
        const choreId = chores[0].id;

        await ChoreRepository.addAssignment(choreId, 0, actor1);
        await ChoreRepository.addAssignment(choreId, 1, actor2);

        // Try move Actor 1 to Tue (should fail)
        const added = await ChoreRepository.addAssignment(choreId, 1, actor1);
        expect(added).toBe(false);

        // Verify state unchanged
        const assignments = await ChoreRepository.getAllAssignments();
        expect(assignments[`${choreId}-0`].length).toBe(1);
        expect(assignments[`${choreId}-1`].length).toBe(1);
        expect(assignments[`${choreId}-1`][0].actorId).toBe(actor2);
    });
});
