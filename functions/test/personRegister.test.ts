import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { createTestClub, cleanUpFirebase, authenticateTestUser, firebaseApp } from './firebaseApp';
import { Crypter } from 'firebase-function';
import { assert } from 'chai';
import { getInvitationLinkId } from './utils';

describe('personRegister', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('register person', async () => {
        assert(firebaseApp.auth.currentUser !== null);
        const hashedUserId = Crypter.sha512(firebaseApp.auth.currentUser.uid);
        await Promise.all((['clubMember', 'clubManager'] as const).map(async authenticationType => await firebaseApp.database.child('clubs').child(clubId.guidString).child('authentication').child(authenticationType).child(hashedUserId).remove()));
        const personId = new Guid('D1852AC0-A0E2-4091-AC7E-CB2C23F708D9');
        const result = await firebaseApp.functions.function('person').function('register').call({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        result.success.equal({
            id: clubId.guidString,
            name: 'Neuer Verein',
            regionCode: 'DE',
            inAppPaymentActive: true
        });
        const databasePerson = await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child(personId.guidString).get('decrypt');
        assert(databasePerson.signInData !== null);
        expect(databasePerson).to.be.deep.equal({
            name: {
                first: 'Jane',
                last: 'Doe'
            },
            fineIds: [],
            signInData: {
                hashedUserId: hashedUserId,
                signInDate: databasePerson.signInData.signInDate
            },
            isInvited: false
        });
        expect(await firebaseApp.database.child('clubs').child(clubId.guidString).child('authentication').child('clubMember').child(hashedUserId).get()).to.be.equal('authenticated');
        expect(await firebaseApp.database.child('clubs').child(clubId.guidString).child('authentication').child('clubManager').child(hashedUserId).exists()).to.be.equal(false);
        expect(await firebaseApp.database.child('users').child(hashedUserId).get('decrypt')).to.be.deep.equal({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        expect(await getInvitationLinkId(clubId, personId)).to.be.equal(null);
    });

    it('person not in club', async () => {
        const personId = Guid.newGuid();
        const result = await firebaseApp.functions.function('person').function('register').call({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        result.failure.equal({
            code: 'not-found',
            message: 'Person doesn\'t exists.'
        });
    });

    it('person already registered', async () => {
        const personId = new Guid('76025DDE-6893-46D2-BC34-9864BB5B8DAD');
        const result = await firebaseApp.functions.function('person').function('register').call({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        result.failure.equal({
            code: 'unavailable',
            message: 'Person is already registered.'
        });
    });
});
