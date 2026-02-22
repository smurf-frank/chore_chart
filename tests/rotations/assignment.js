describe('Group Rotation Assignment', () => {
    beforeEach(async () => {
        await createSchema();
    });

    it('getGroupMembers returns members sorted alphabetically', async () => {
        // Add people in non-alphabetical order
        await ChoreRepository.addPerson('Charlie', 'CH', '#333');
        await ChoreRepository.addPerson('Alice', 'AL', '#111');
        await ChoreRepository.addPerson('Bob', 'BO', '#222');
        const allPeople = await ChoreRepository.getAllPeople();
        // Only use the 3 people we just added
        const testPeople = allPeople.filter(p => ['Alice', 'Bob', 'Charlie'].includes(p.name));
        await ChoreRepository.addGroup('Team', 'TM', '#000', false, testPeople.map(p => p.id));
        const group = (await ChoreRepository.getAllGroups())[0];
        const members = await ChoreRepository.getGroupMembers(group.id);
        expect(members.length).toBe(3);
        expect(members[0].name).toBe('Alice');
        expect(members[1].name).toBe('Bob');
        expect(members[2].name).toBe('Charlie');
    });

    it('assignGroupRotation fills all 7 days', async () => {
        // Use the seeded people directly
        const people = await ChoreRepository.getAllPeople();
        await ChoreRepository.addGroup('Team', 'TM', '#000', false, [people[0].id, people[1].id]);
        const group = (await ChoreRepository.getAllGroups())[0];
        const chores = await ChoreRepository.getAllChores();
        const members = await ChoreRepository.getGroupMembers(group.id);

        await ChoreRepository.assignGroupRotation(chores[0].id, group.id, members[0].id, 0);
        const assignments = await ChoreRepository.getAllAssignments();
        let count = 0;
        for (let d = 0; d < 7; d++) {
            const key = `${chores[0].id}-${d}`;
            if (assignments[key]) count += assignments[key].length;
        }
        expect(count).toBe(7);
    });

    it('assignGroupRotation rotates members correctly', async () => {
        await ChoreRepository.addPerson('Alice', 'AL', '#111');
        await ChoreRepository.addPerson('Bob', 'BO', '#222');
        await ChoreRepository.addPerson('Charlie', 'CH', '#333');
        const allPeople = await ChoreRepository.getAllPeople();
        const testPeople = allPeople.filter(p => ['Alice', 'Bob', 'Charlie'].includes(p.name));
        await ChoreRepository.addGroup('Team', 'TM', '#000', false, testPeople.map(p => p.id));
        const groups = await ChoreRepository.getAllGroups();
        const group = groups[groups.length - 1]; // Use newly added group
        const chores = await ChoreRepository.getAllChores();
        const members = await ChoreRepository.getGroupMembers(group.id);

        // Start with Alice on Mon (day 0)
        await ChoreRepository.assignGroupRotation(chores[0].id, group.id, members[0].id, 0);
        const assignments = await ChoreRepository.getAllAssignments();
        expect(assignments[`${chores[0].id}-0`][0].name).toBe('Alice');
        expect(assignments[`${chores[0].id}-1`][0].name).toBe('Bob');
        expect(assignments[`${chores[0].id}-2`][0].name).toBe('Charlie');
        expect(assignments[`${chores[0].id}-3`][0].name).toBe('Alice');
        expect(assignments[`${chores[0].id}-4`][0].name).toBe('Bob');
        expect(assignments[`${chores[0].id}-5`][0].name).toBe('Charlie');
        expect(assignments[`${chores[0].id}-6`][0].name).toBe('Alice');
    });

    it('assignGroupRotation respects start member and start day', async () => {
        await ChoreRepository.addPerson('Alice', 'AL', '#111');
        await ChoreRepository.addPerson('Bob', 'BO', '#222');
        await ChoreRepository.addPerson('Charlie', 'CH', '#333');
        const allPeople = await ChoreRepository.getAllPeople();
        const testPeople = allPeople.filter(p => ['Alice', 'Bob', 'Charlie'].includes(p.name));
        await ChoreRepository.addGroup('Team', 'TM', '#000', false, testPeople.map(p => p.id));
        const groups = await ChoreRepository.getAllGroups();
        const group = groups[groups.length - 1];
        const chores = await ChoreRepository.getAllChores();
        const members = await ChoreRepository.getGroupMembers(group.id);

        // Start with Bob on Wed (day 2)
        const bob = members.find(m => m.name === 'Bob');
        await ChoreRepository.assignGroupRotation(chores[0].id, group.id, bob.id, 2);
        const assignments = await ChoreRepository.getAllAssignments();
        expect(assignments[`${chores[0].id}-2`][0].name).toBe('Bob');
        expect(assignments[`${chores[0].id}-3`][0].name).toBe('Charlie');
        expect(assignments[`${chores[0].id}-4`][0].name).toBe('Alice');
        expect(assignments[`${chores[0].id}-5`][0].name).toBe('Bob');
        expect(assignments[`${chores[0].id}-6`][0].name).toBe('Charlie');
        expect(assignments[`${chores[0].id}-0`][0].name).toBe('Alice');
        expect(assignments[`${chores[0].id}-1`][0].name).toBe('Bob');
    });

    it('assignGroupRotation wraps days around the week', async () => {
        await ChoreRepository.addPerson('Alice', 'AL', '#111');
        await ChoreRepository.addPerson('Bob', 'BO', '#222');
        const allPeople = await ChoreRepository.getAllPeople();
        const testPeople = allPeople.filter(p => ['Alice', 'Bob'].includes(p.name));
        await ChoreRepository.addGroup('Duo', 'DU', '#000', false, testPeople.map(p => p.id));
        const groups = await ChoreRepository.getAllGroups();
        const group = groups[groups.length - 1];
        const chores = await ChoreRepository.getAllChores();
        const members = await ChoreRepository.getGroupMembers(group.id);

        // Start on Sat (day 5)
        await ChoreRepository.assignGroupRotation(chores[0].id, group.id, members[0].id, 5);
        const assignments = await ChoreRepository.getAllAssignments();
        expect(assignments[`${chores[0].id}-5`][0].name).toBe('Alice');
        expect(assignments[`${chores[0].id}-6`][0].name).toBe('Bob');
        expect(assignments[`${chores[0].id}-0`][0].name).toBe('Alice');
        expect(assignments[`${chores[0].id}-1`][0].name).toBe('Bob');
    });
});
