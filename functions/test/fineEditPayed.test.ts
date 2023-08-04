import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';
import { UtcDate } from 'firebase-function';

describe('fineEditPayed', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('no fine', async () => {
        const result = await firebaseApp.functions.function('fine').function('editPayed').call({
            clubId: clubId.guidString,
            fineId: Guid.newGuid().guidString,
            payedState: 'unpayed'
        });
        result.failure.equal({
            code: 'not-found',
            message: 'Couldn\'t found fine to edit payed state.'
        });
    });

    it('to unpayed', async () => {
        const fineId = new Guid('02462A8B-107F-4BAE-A85B-EFF1F727C00F');
        const result = await firebaseApp.functions.function('fine').function('editPayed').call({
            clubId: clubId.guidString,
            fineId: fineId.guidString,
            payedState: 'unpayed'
        });
        result.success;
        expect((await firebaseApp.database.child('clubs').child(clubId.guidString).child('fines').child(fineId.guidString).get('decrypt')).payedState).to.be.equal('unpayed');
        const databaseFineChange = await firebaseApp.database.child('clubs').child(clubId.guidString).child('changes').child('fines').child(fineId.guidString).get();
        expect(UtcDate.decode(databaseFineChange).setted({ hour: 0, minute: 0 })).to.be.deep.equal(UtcDate.now.setted({ hour: 0, minute: 0 }));
    });

    it('to payed', async () => {
        const fineId = new Guid('0B5F958E-9D7D-46E1-8AEE-F52F4370A95A');
        const result = await firebaseApp.functions.function('fine').function('editPayed').call({
            clubId: clubId.guidString,
            fineId: fineId.guidString,
            payedState: 'payed'
        });
        result.success;
        expect((await firebaseApp.database.child('clubs').child(clubId.guidString).child('fines').child(fineId.guidString).get('decrypt')).payedState).to.be.equal('payed');
        const databaseFineChange = await firebaseApp.database.child('clubs').child(clubId.guidString).child('changes').child('fines').child(fineId.guidString).get();
        expect(UtcDate.decode(databaseFineChange).setted({ hour: 0, minute: 0 })).to.be.deep.equal(UtcDate.now.setted({ hour: 0, minute: 0 }));
    });
});
