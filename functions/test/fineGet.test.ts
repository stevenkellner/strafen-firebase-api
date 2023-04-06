import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';
import * as defaultTestClub from '../src/testClubs/default.json';
import { type Fine } from '../src/types/Fine';

describe('fineGet', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('get null fines', async () => {
        await firebaseApp.database.child('clubs').child(clubId.guidString).child('fines').remove();
        const result = await firebaseApp.functions.function('fine').function('get').call({
            clubId: clubId.guidString
        });
        result.success.equal({});
    });

    it('get empty fines', async () => {
        await firebaseApp.database.child('clubs').child(clubId.guidString).child('fines').set({});
        const result = await firebaseApp.functions.function('fine').function('get').call({
            clubId: clubId.guidString
        });
        result.success.equal({});
    });

    it('get fines', async () => {
        const result = await firebaseApp.functions.function('fine').function('get').call({
            clubId: clubId.guidString
        });
        result.success.equal(defaultTestClub.fines as Record<string, Omit<Fine.Flatten, 'id'>>);
    });
});
