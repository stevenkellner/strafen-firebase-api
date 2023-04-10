import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';

describe('invitationLinkWithdraw', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('withdraw existsing', async () => {
        const personId = new Guid('D1852AC0-A0E2-4091-AC7E-CB2C23F708D9');
        const result1 = await firebaseApp.functions.function('invitationLink').function('createId').call({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        const id = result1.success.value;
        const result2 = await firebaseApp.functions.function('invitationLink').function('withdraw').call({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        result2.success;
        expect(await firebaseApp.database.child('invitationLinks').child(id).exists()).to.be.equal(false);
    });

    it('withdraw not existsing', async () => {
        const result = await firebaseApp.functions.function('invitationLink').function('withdraw').call({
            clubId: clubId.guidString,
            personId: Guid.newGuid().guidString
        });
        result.success;
    });
});
