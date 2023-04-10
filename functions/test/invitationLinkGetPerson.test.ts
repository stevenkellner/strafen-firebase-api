import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';

describe('invitationLinkGetPerson', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('existing id', async () => {
        const personId = new Guid('D1852AC0-A0E2-4091-AC7E-CB2C23F708D9');
        const result1 = await firebaseApp.functions.function('invitationLink').function('createId').call({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        const id = result1.success.value;
        const result2 = await firebaseApp.functions.function('invitationLink').function('getPerson').call({
            invitationLinkId: id
        });
        result2.success.equal({
            id: personId.guidString,
            name: { first: 'Jane', last: 'Doe' },
            fineIds: [],
            signInData: null,
            club: {
                id: clubId.guidString,
                name: 'Neuer Verein',
                regionCode: 'DE',
                inAppPaymentActive: true
            }
        });
    });

    it('not existing id', async () => {
        const result = await firebaseApp.functions.function('invitationLink').function('getPerson').call({
            invitationLinkId: 'invalid'
        });
        result.failure.equal({
            code: 'not-found',
            message: 'Couldn\'t find invitation link id.'
        });
    });
});
