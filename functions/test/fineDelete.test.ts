import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';

describe('fineDelete', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('delete not existing', async () => {
        const fineId = Guid.newGuid();
        const result = await firebaseApp.functions.function('fine').function('delete').call({
            clubId: clubId.guidString,
            fineId: fineId.guidString
        });
        result.success;
    });

    it('delete existing', async () => {
        const fineId = new Guid('02462A8B-107F-4BAE-A85B-EFF1F727C00F');
        const result = await firebaseApp.functions.function('fine').function('delete').call({
            clubId: clubId.guidString,
            fineId: fineId.guidString
        });
        result.success;
        expect(await firebaseApp.database.child('clubs').child(clubId.guidString).child('fines').child(fineId.guidString).exists()).to.be.equal(false);
        const databasePerson = await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child('76025DDE-6893-46D2-BC34-9864BB5B8DAD').get('decrypt');
        expect(databasePerson.fineIds.includes(fineId.guidString)).to.be.equal(false);
    });
});
