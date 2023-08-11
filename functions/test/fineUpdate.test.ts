import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';
import { UtcDate } from 'firebase-function';

describe('fineUpdate', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('update not existing', async () => {
        const fineId = Guid.newGuid();
        const result = await firebaseApp.functions.function('fine').function('update').call({
            clubId: clubId.guidString,
            fine: {
                id: fineId.guidString,
                personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                date: '2023-02-20-17-23',
                payedState: 'unpayed',
                reasonMessage: 'test-message-1',
                amount: 9.50
            }
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t update not existing fine.'
        });
    });

    it('update existing', async () => {
        const fineId = new Guid('02462A8B-107F-4BAE-A85B-EFF1F727C00F');
        const result = await firebaseApp.functions.function('fine').function('update').call({
            clubId: clubId.guidString,
            fine: {
                id: fineId.guidString,
                personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                date: '2023-02-20-17-23',
                payedState: 'unpayed',
                reasonMessage: 'test-message-1',
                amount: { 
                    item: 'crateOfBeer',
                    count: 3
                }
            }
        });
        result.success;
        const databasefine = await firebaseApp.database.child('clubs').child(clubId.guidString).child('fines').child(fineId.guidString).get('decrypt');
        expect(databasefine).to.be.deep.equal({
            personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            date: '2023-02-20-17-23',
            payedState: 'unpayed',
            reasonMessage: 'test-message-1',
            amount: { 
                item: 'crateOfBeer',
                count: 3
            }
        });
        const databaseFineChange = await firebaseApp.database.child('clubs').child(clubId.guidString).child('changes').child('fines').child(fineId.guidString).get();
        expect(UtcDate.decode(databaseFineChange.slice(0, 16)).setted({ hour: 0, minute: 0 })).to.be.deep.equal(UtcDate.now.setted({ hour: 0, minute: 0 }));
    });
});
