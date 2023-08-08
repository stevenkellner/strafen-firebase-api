import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';
import * as defaultTestClub from '../src/testClubs/default.json';
import { Fine } from '../src/types/Fine';

describe('fineGetChanges', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('get changes', async () => {
        const result = await firebaseApp.functions.function('fine').function('getChanges').call({
            clubId: clubId.guidString
        });
        result.success.unsorted([
            {
                id: '1B5F958E-9D7D-46E1-8AEE-F52F4370A95A',
                ...defaultTestClub.fines['1B5F958E-9D7D-46E1-8AEE-F52F4370A95A'] as Omit<Fine.Flatten, 'id'>
            },
            {
                deleted: '442AD0E0-9809-4C4D-B3A3-9F56AA939CD5'
            }
        ]);        
    });

    it('get empty changes', async () => {
        await firebaseApp.database.child('clubs').child(clubId.guidString).child('changes').child('fines').set({});
        const result = await firebaseApp.functions.function('fine').function('getChanges').call({
            clubId: clubId.guidString
        });
        result.success.equal([]);
    });
});
