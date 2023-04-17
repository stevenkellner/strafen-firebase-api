import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';

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
            payedState: {
                state: 'settled'
            }
        });
        result.failure.equal({
            code: 'not-found',
            message: 'Couldn\'t found fine to edit payed state.'
        });
    });

    it('to settled', async () => {
        const fineId = new Guid('1B5F958E-9D7D-46E1-8AEE-F52F4370A95A');
        const result = await firebaseApp.functions.function('fine').function('editPayed').call({
            clubId: clubId.guidString,
            fineId: fineId.guidString,
            payedState: {
                state: 'settled'
            }
        });
        result.success;
        expect((await firebaseApp.database.child('clubs').child(clubId.guidString).child('fines').child(fineId.guidString).get('decrypt')).payedState).to.be.deep.equal({
            state: 'settled'
        });
    });

    it('to unpayed', async () => {
        const fineId = new Guid('02462A8B-107F-4BAE-A85B-EFF1F727C00F');
        const result = await firebaseApp.functions.function('fine').function('editPayed').call({
            clubId: clubId.guidString,
            fineId: fineId.guidString,
            payedState: {
                state: 'unpayed'
            }
        });
        result.success;
        expect((await firebaseApp.database.child('clubs').child(clubId.guidString).child('fines').child(fineId.guidString).get('decrypt')).payedState).to.be.deep.equal({
            state: 'unpayed'
        });
    });

    it('to payed', async () => {
        const fineId = new Guid('0B5F958E-9D7D-46E1-8AEE-F52F4370A95A');
        const result = await firebaseApp.functions.function('fine').function('editPayed').call({
            clubId: clubId.guidString,
            fineId: fineId.guidString,
            payedState: {
                state: 'payed',
                payDate: '2023-02-22T17:23:45.678Z'
            }
        });
        result.success;
        expect((await firebaseApp.database.child('clubs').child(clubId.guidString).child('fines').child(fineId.guidString).get('decrypt')).payedState).to.be.deep.equal({
            state: 'payed',
            payDate: '2023-02-22T17:23:45.678Z'
        });
    });
});
