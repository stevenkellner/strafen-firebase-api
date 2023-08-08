import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';

describe('invitationLinkCreateId', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('create id', async () => {
        const personId = new Guid('D1852AC0-A0E2-4091-AC7E-CB2C23F708D9');
        const result = await firebaseApp.functions.function('invitationLink').function('createId').call({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        const id = result.success.value;
        expect(id.length).to.be.equal(16);
        expect(await firebaseApp.database.child('invitationLinks').child(id).get('decrypt')).to.be.deep.equal({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        const person = await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child(personId.guidString).get('decrypt');
        expect(person.invitationLinkId).to.be.equal(id);
    });

    it('create id twice', async () => {
        const personId = new Guid('D1852AC0-A0E2-4091-AC7E-CB2C23F708D9');
        const result1 = await firebaseApp.functions.function('invitationLink').function('createId').call({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        result1.success;
        const result2 = await firebaseApp.functions.function('invitationLink').function('createId').call({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        const id = result2.success.value;
        expect(id.length).to.be.equal(16);
        expect(await firebaseApp.database.child('invitationLinks').child(id).get('decrypt')).to.be.deep.equal({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        expect(id).to.be.equal(result1.success.value);
    });

    it('registered person', async () => {
        const personId = new Guid('76025DDE-6893-46D2-BC34-9864BB5B8DAD');
        const result = await firebaseApp.functions.function('invitationLink').function('createId').call({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        result.failure.equal({
            code: 'unavailable',
            message: 'Couldn\'t invite registered person.'
        });
    });

    it('not existing person', async () => {
        const personId = Guid.newGuid();
        const result = await firebaseApp.functions.function('invitationLink').function('createId').call({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        result.failure.equal({
            code: 'not-found',
            message: 'Couldn\'t invite not existing person.'
        });
    });
});
