import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';
import { UtcDate } from 'firebase-function';

describe('fineAdd', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('add not existing', async () => {
        const fineId = Guid.newGuid();
        const result = await firebaseApp.functions.function('fine').function('add').call({
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
        result.success;
        const databaseFine = await firebaseApp.database.child('clubs').child(clubId.guidString).child('fines').child(fineId.guidString).get('decrypt');
        expect(databaseFine).to.be.deep.equal({
            personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            date: '2023-02-20-17-23',
            payedState: 'unpayed',
            reasonMessage: 'test-message-1',
            amount: 9.50
        });
        const databasePerson = await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7').get('decrypt');
        expect(databasePerson.fineIds.includes(fineId.guidString)).to.be.equal(true);
        const databaseFineChange = await firebaseApp.database.child('clubs').child(clubId.guidString).child('changes').child('fines').child(fineId.guidString).get();
        expect(UtcDate.decode(databaseFineChange.slice(0, 16)).setted({ hour: 0, minute: 0 })).to.be.deep.equal(UtcDate.now.setted({ hour: 0, minute: 0 }));
        const databasePersonChange = await firebaseApp.database.child('clubs').child(clubId.guidString).child('changes').child('persons').child('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7').get();
        expect(UtcDate.decode(databasePersonChange.slice(0, 16)).setted({ hour: 0, minute: 0 })).to.be.deep.equal(UtcDate.now.setted({ hour: 0, minute: 0 }));
    });

    it('add existing', async () => {
        const fineId = new Guid('02462A8B-107F-4BAE-A85B-EFF1F727C00F');
        const result = await firebaseApp.functions.function('fine').function('add').call({
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
            message: 'Couldn\'t add existing fine.'
        });
    });
});
