import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';
import * as defaultTestClub from '../src/testClubs/default.json';
import { type Fine } from '../src/types/Fine';

describe('fineGetSingle', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('get fine', async () => {
        const result = await firebaseApp.functions.function('fine').function('getSingle').call({
            clubId: clubId.guidString,
            fineId: Guid.newGuid().guidString
        });
        result.success.equal(null);
    });

    it('get not existing fine', async () => {
        const fineId = '02462A8B-107F-4BAE-A85B-EFF1F727C00F' as const;
        const result = await firebaseApp.functions.function('fine').function('getSingle').call({
            clubId: clubId.guidString,
            fineId: fineId
        });
        result.success.equal({
            id: fineId,
            ...defaultTestClub.fines[fineId] as Omit<Fine.Flatten, 'id'>
        });
    });
});
