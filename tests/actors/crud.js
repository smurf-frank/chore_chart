describe('Actor CRUD', () => {
    beforeEach(async () => {
        await createSchema();
    });

    it('getAllPeople() returns seeded people', async () => {
        const people = await ChoreRepository.getAllPeople();
        expect(people.length).toBe(3);
        expect(people[0].name).toBe('User 1');
    });

    it('getAllActors() returns all actors regardless of type', async () => {
        await dbExecute("INSERT INTO actors (type, name, initials, color) VALUES ('ai_agent', 'Bot', 'BT', '#000')");
        const all = await ChoreRepository.getAllActors();
        expect(all.length).toBe(4);
    });

    it('getAllActors(type) filters by type', async () => {
        await dbExecute("INSERT INTO actors (type, name, initials, color) VALUES ('ai_agent', 'Bot', 'BT', '#000')");
        const people = await ChoreRepository.getAllActors('person');
        expect(people.length).toBe(3);
        const agents = await ChoreRepository.getAllActors('ai_agent');
        expect(agents.length).toBe(1);
        expect(agents[0].name).toBe('Bot');
    });

    it('addPerson() adds a person-type actor', async () => {
        await ChoreRepository.addPerson('Mom', 'MO', '#ff00ff');
        const people = await ChoreRepository.getAllPeople();
        expect(people.length).toBe(4);
        const mom = people.find(p => p.name === 'Mom');
        expect(mom.initials).toBe('MO');
        expect(mom.color).toBe('#ff00ff');
        expect(mom.type).toBe('person');
    });

    it('addActor() adds actor with type and metadata', async () => {
        await ChoreRepository.addActor('webhook', 'Slack', 'SL', '#4a154b', { url: 'https://hooks.slack.com/test' });
        const webhooks = await ChoreRepository.getAllActors('webhook');
        expect(webhooks.length).toBe(1);
        expect(webhooks[0].metadata.url).toBe('https://hooks.slack.com/test');
    });

    it('updateActor() updates specific fields', async () => {
        const people = await ChoreRepository.getAllPeople();
        const id = people[0].id;
        await ChoreRepository.updateActor(id, { name: 'Dad', initials: 'DA' });
        const updated = await ChoreRepository.getAllPeople();
        const dad = updated.find(p => p.id === id);
        expect(dad.name).toBe('Dad');
        expect(dad.initials).toBe('DA');
        expect(dad.color).toBe(people[0].color); // unchanged
    });

    it('updateActor() updates metadata', async () => {
        await ChoreRepository.addActor('ai_agent', 'Bot', 'BT', '#000', { model: 'gpt-3' });
        const agents = await ChoreRepository.getAllActors('ai_agent');
        await ChoreRepository.updateActor(agents[0].id, { metadata: { model: 'gpt-4' } });
        const updated = await ChoreRepository.getAllActors('ai_agent');
        expect(updated[0].metadata.model).toBe('gpt-4');
    });

    it('removeActor() deletes actor', async () => {
        const people = await ChoreRepository.getAllPeople();
        await ChoreRepository.removeActor(people[0].id);
        const remaining = await ChoreRepository.getAllPeople();
        expect(remaining.length).toBe(2);
    });

    it('removeActor() also deletes their assignments', async () => {
        const people = await ChoreRepository.getAllPeople();
        await ChoreRepository.setAssignment(1, 0, people[0].id);
        await ChoreRepository.removeActor(people[0].id);
        const assignments = await ChoreRepository.getAllAssignments();
        expect(Object.keys(assignments).length).toBe(0); // Assuming no assignments initially
    });

    it('removePerson() is alias for removeActor()', async () => {
        const people = await ChoreRepository.getAllPeople();
        await ChoreRepository.removePerson(people[2].id);
        const remaining = await ChoreRepository.getAllPeople();
        expect(remaining.length).toBe(2);
    });

    it('actors are ordered by id', async () => {
        const people = await ChoreRepository.getAllPeople();
        for (let i = 1; i < people.length; i++) {
            expect(people[i].id > people[i - 1].id).toBe(true);
        }
    });

    it('metadata defaults to empty object', async () => {
        const people = await ChoreRepository.getAllPeople();
        expect(JSON.stringify(people[0].metadata)).toBe('{}');
    });
});
