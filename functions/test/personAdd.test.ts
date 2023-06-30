import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';

describe('personAdd', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('add not existing', async () => {
        const personId = Guid.newGuid();
        const result = await firebaseApp.functions.function('person').function('add').call({
            clubId: clubId.guidString,
            person: {
                id: personId.guidString,
                name: { first: 'lk', last: 'uioz' }
            }
        });
        result.success;
        const databasePerson = await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child(personId.guidString).get('decrypt');
        expect(databasePerson).to.be.deep.equal({
            name: { first: 'lk', last: 'uioz' },
            fineIds: [],
            signInData: null,
            isInvited: false
        });
    });

    it('add existing', async () => {
        const personId = new Guid('D1852AC0-A0E2-4091-AC7E-CB2C23F708D9');
        const result = await firebaseApp.functions.function('person').function('add').call({
            clubId: clubId.guidString,
            person: {
                id: personId.guidString,
                name: { first: 'lk', last: 'uioz' }
            }
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t add existing person.'
        });
    });
});
