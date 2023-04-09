import { assert } from 'chai';
import { Guid } from '../src/types/Guid';
import { createTestClub, cleanUpFirebase, authenticateTestUser, firebaseApp } from './firebaseApp';
import { Crypter } from 'firebase-function';

describe('personGetCurrent', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('get person no admin', async () => {
        assert(firebaseApp.auth.currentUser !== null);
        const hashedUserId = Crypter.sha512(firebaseApp.auth.currentUser.uid);
        await firebaseApp.database.child('clubs').child(clubId.guidString).child('authentication').child('clubManager').child(hashedUserId).remove();
        const personId = Guid.newGuid();
        await firebaseApp.database.child('users').child(hashedUserId).set({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        const signInDate = new Date();
        await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child(personId.guidString).set({
            name: { first: 'lk', last: 'oiqjr' },
            fineIds: [],
            signInData: {
                hashedUserId: hashedUserId,
                signInDate: signInDate.toISOString()
            }
        }, 'encrypt');
        const result = await firebaseApp.functions.function('person').function('getCurrent').call({});
        result.success.equal({
            id: personId.guidString,
            name: { first: 'lk', last: 'oiqjr' },
            fineIds: [],
            signInData: {
                hashedUserId: hashedUserId,
                signInDate: signInDate.toISOString()
            },
            isAdmin: false,
            club: {
                id: clubId.guidString,
                name: 'Neuer Verein',
                identifier: 'demo-team',
                regionCode: 'DE',
                inAppPaymentActive: true
            }
        });
    });

    it('get person admin', async () => {
        assert(firebaseApp.auth.currentUser !== null);
        const hashedUserId = Crypter.sha512(firebaseApp.auth.currentUser.uid);
        const personId = Guid.newGuid();
        await firebaseApp.database.child('users').child(hashedUserId).set({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        const signInDate = new Date();
        await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child(personId.guidString).set({
            name: { first: 'lk', last: 'oiqjr' },
            fineIds: [],
            signInData: {
                hashedUserId: hashedUserId,
                signInDate: signInDate.toISOString()
            }
        }, 'encrypt');
        const result = await firebaseApp.functions.function('person').function('getCurrent').call({});
        result.success.equal({
            id: personId.guidString,
            name: { first: 'lk', last: 'oiqjr' },
            fineIds: [],
            signInData: {
                hashedUserId: hashedUserId,
                signInDate: signInDate.toISOString()
            },
            isAdmin: true,
            club: {
                id: clubId.guidString,
                name: 'Neuer Verein',
                identifier: 'demo-team',
                regionCode: 'DE',
                inAppPaymentActive: true
            }
        });
    });

    it('get not existing person', async () => {
        const result = await firebaseApp.functions.function('person').function('getCurrent').call({});
        result.failure.equal({
            code: 'not-found',
            message: 'Person doesn\'t exist.'
        });
    });
});
