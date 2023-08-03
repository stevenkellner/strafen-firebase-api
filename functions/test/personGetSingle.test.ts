import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';
import * as defaultTestClub from '../src/testClubs/default.json';
import { type Person } from '../src/types/Person';

describe('personGetSingle', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('get person', async () => {
        const result = await firebaseApp.functions.function('person').function('getSingle').call({
            clubId: clubId.guidString,
            personId: Guid.newGuid().guidString
        });
        result.success.equal(null);
    });

    it('get not existing person', async () => {
        const personId = '76025DDE-6893-46D2-BC34-9864BB5B8DAD' as const;
        const result = await firebaseApp.functions.function('person').function('getSingle').call({
            clubId: clubId.guidString,
            personId: personId
        });
        result.success.equal({
            id: personId,
            ...defaultTestClub.persons[personId] as Omit<Person.Flatten, 'id'>
        });
    });
});
