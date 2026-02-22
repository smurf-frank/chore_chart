describe('Group Management & Nesting', () => {
    beforeEach(async () => {
        await createSchema();
        // Add some people
        await ChoreRepository.addPerson('Bob', 'BOB', '#000000');
        await ChoreRepository.addPerson('Alice', 'ALC', '#ffffff');
    });

    it('should add a group', async () => {
        await ChoreRepository.addGroup('Kids', 'KDS', '#ff0000', true, []);
        const groups = await ChoreRepository.getAllGroups();
        expect(groups.length).toBe(1);
        expect(groups[0].name).toBe('Kids');
        expect(groups[0].type).toBe('group');
        expect(groups[0].showAsMarker).toBe(true);
    });

    it('should add members to a group', async () => {
        const people = await ChoreRepository.getAllPeople();
        const bob = people.find(p => p.name === 'Bob');

        await ChoreRepository.addGroup('Drivers', 'DRV', '#00ff00', false, [bob.id]);

        const groups = await ChoreRepository.getAllGroups();
        const members = await ChoreRepository.getGroupMembers(groups[0].id);

        expect(members.length).toBe(1);
        expect(members[0].name).toBe('Bob');
    });

    it('removeActor() should remove person from groups', async () => {
        const people = await ChoreRepository.getAllPeople();
        const bob = people.find(p => p.name === 'Bob');

        await ChoreRepository.addGroup('Team', 'TM', '#0000ff', false, [bob.id]);
        let groups = await ChoreRepository.getAllGroups();
        expect(groups[0].memberIds.includes(bob.id)).toBe(true);

        // Remove Bob
        await ChoreRepository.removeActor(bob.id);

        // Verify Bob is gone from group
        groups = await ChoreRepository.getAllGroups();
        expect(groups[0].memberIds.includes(bob.id)).toBe(false);
        expect(groups[0].memberIds.length).toBe(0);
    });

    it('should update group details', async () => {
        await ChoreRepository.addGroup('Old Name', 'OLD', '#000000');
        const groups = await ChoreRepository.getAllGroups();
        const id = groups[0].id;

        await ChoreRepository.updateGroup(id, { name: 'New Name', showAsMarker: true });

        const updated = (await ChoreRepository.getAllGroups())[0];
        expect(updated.name).toBe('New Name');
        expect(updated.showAsMarker).toBe(true);
    });

    it('should allow adding a person to a group (Depth 1)', async () => {
        await ChoreRepository.addPerson('P1', 'P1', '#000');
        const p1 = (await ChoreRepository.getAllPeople())[2]; // Index 2 because Bob and Alice are 0 and 1
        await ChoreRepository.addGroup('G1', 'G1', '#000', false, [p1.id]);

        const groups = await ChoreRepository.getAllGroups();
        const g1 = groups[groups.length - 1];
        expect(g1.memberIds.includes(p1.id)).toBe(true);
        expect(await ChoreRepository.getGroupDepth(g1.id)).toBe(1);
    });

    it('should allow nesting G2 -> G1 (Depth 2)', async () => {
        await ChoreRepository.addGroup('G2', 'G2', '#000'); // Leaf group
        const g2 = (await ChoreRepository.getAllGroups())[0];

        await ChoreRepository.addGroup('G1', 'G1', '#000', false, [g2.id]);
        const g1 = (await ChoreRepository.getAllGroups())[1];

        expect(g1.memberIds.includes(g2.id)).toBe(true);
        expect(await ChoreRepository.getGroupDepth(g2.id)).toBe(1);
        expect(await ChoreRepository.getGroupDepth(g1.id)).toBe(2);
    });

    it('should allow nesting G3 -> G2 -> G1 (Depth 3)', async () => {
        await ChoreRepository.addGroup('G3', 'G3', '#000');
        const g3 = (await ChoreRepository.getAllGroups())[0];

        await ChoreRepository.addGroup('G2', 'G2', '#000', false, [g3.id]);
        const g2 = (await ChoreRepository.getAllGroups())[1];

        await ChoreRepository.addGroup('G1', 'G1', '#000', false, [g2.id]);
        const g1 = (await ChoreRepository.getAllGroups())[2];

        expect(await ChoreRepository.getGroupDepth(g1.id)).toBe(3);
    });

    it('should prevent nesting deeper than 3 levels (G4 -> G3 -> G2 -> G1)', async () => {
        // G3 -> G2 -> G1
        await ChoreRepository.addGroup('G1', 'G1', '#000');
        const g1 = (await ChoreRepository.getAllGroups())[0];

        await ChoreRepository.addGroup('G2', 'G2', '#000', false, [g1.id]);
        const g2 = (await ChoreRepository.getAllGroups())[1];

        await ChoreRepository.addGroup('G3', 'G3', '#000', false, [g2.id]);
        const g3 = (await ChoreRepository.getAllGroups())[2];

        // Create G4, try to add G3
        await ChoreRepository.addGroup('G4', 'G4', '#000');
        const g4 = (await ChoreRepository.getAllGroups())[3];

        const canAdd = await ChoreRepository.canAddMember(g4.id, g3.id);
        expect(canAdd).toBe(false);
    });

    it('should prevent circular dependency (A -> B -> A)', async () => {
        await ChoreRepository.addGroup('A', 'A', '#000');
        const a = (await ChoreRepository.getAllGroups())[0];

        await ChoreRepository.addGroup('B', 'B', '#000', false, [a.id]);
        const b = (await ChoreRepository.getAllGroups())[1];

        // Try adding B to A
        const canAdd = await ChoreRepository.canAddMember(a.id, b.id);
        expect(canAdd).toBe(false);
    });

    it('getGroupMembers should return both people and groups', async () => {
        await ChoreRepository.addPerson('P1', 'P1', '#000');
        const people = await ChoreRepository.getAllPeople();
        const p1 = people[people.length - 1];

        await ChoreRepository.addGroup('G2', 'G2', '#000', false, [p1.id]);
        const groups = await ChoreRepository.getAllGroups();
        const g2 = groups[groups.length - 1];

        await ChoreRepository.addGroup('G1', 'G1', '#000', false, [g2.id]);
        const allGroups = await ChoreRepository.getAllGroups();
        const g1 = allGroups[allGroups.length - 1];

        const members = await ChoreRepository.getGroupMembers(g1.id);
        expect(members.length).toBe(1);
        expect(members[0].id).toBe(g2.id);
        expect(members[0].type).toBe('group');
    });
});
