import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';
import { Crypter } from 'firebase-function';

describe('notificationRegister', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('person not exists', async () => {
        const personId = Guid.newGuid();
        const result = await firebaseApp.functions.function('notification').function('register').call({
            clubId: clubId.guidString,
            personId: personId.guidString,
            token: 'abc123'
        });
        result.failure.equal({
            code: 'not-found',
            message: 'Person doesn\'t exist.'
        });
    });

    it('person not signed in', async () => {
        const personId = new Guid('D1852AC0-A0E2-4091-AC7E-CB2C23F708D9');
        const result = await firebaseApp.functions.function('notification').function('register').call({
            clubId: clubId.guidString,
            personId: personId.guidString,
            token: 'abc123'
        });
        result.failure.equal({
            code: 'unavailable',
            message: 'Person is not signed in.'
        });
    });

    it('register nottification', async () => {
        const personId = new Guid('76025DDE-6893-46D2-BC34-9864BB5B8DAD');
        const result1 = await firebaseApp.functions.function('notification').function('register').call({
            clubId: clubId.guidString,
            personId: personId.guidString,
            token: 'abc123'
        });
        result1.success;
        expect((await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child(personId.guidString).get('decrypt')).signInData?.notificationTokens).to.be.deep.equal({
            [Crypter.sha512('abc123').slice(0, 16)]: 'abc123'
        });
        const result2 = await firebaseApp.functions.function('notification').function('register').call({
            clubId: clubId.guidString,
            personId: personId.guidString,
            token: 'xyz987'
        });
        result2.success;
        expect((await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child(personId.guidString).get('decrypt')).signInData?.notificationTokens).to.be.deep.equal({
            [Crypter.sha512('abc123').slice(0, 16)]: 'abc123',
            [Crypter.sha512('xyz987').slice(0, 16)]: 'xyz987'
        });
    });
});
