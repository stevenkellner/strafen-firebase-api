import { expect } from 'firebase-function/lib/src/testUtils';
import { Amount } from '../src/types/Amount';
import { Fine } from '../src/types/Fine';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';
import { getInvitationLinkId } from './utils';
import { UtcDate } from 'firebase-function';

describe('personDelete', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('delete not existing', async () => {
        const personId = Guid.newGuid();
        const result = await firebaseApp.functions.function('person').function('delete').call({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        result.success;
    });

    it('delete existing', async () => {
        const personId = new Guid('D1852AC0-A0E2-4091-AC7E-CB2C23F708D9');
        const fineId = Guid.newGuid();
        const fine: Omit<Fine, 'id'> = {
            personId: personId,
            date: UtcDate.now,
            reasonMessage: 'asdf',
            amount: new Amount(1, 50),
            payedState: 'unpayed'
        };
        await firebaseApp.database.child('clubs').child(clubId.guidString).child('fines').child(fineId.guidString).set(Fine.flatten(fine), 'encrypt');
        const person = await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child(personId.guidString).get('decrypt');
        person.fineIds.push(fineId.guidString);
        await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child(personId.guidString).set(person, 'encrypt');
        const result = await firebaseApp.functions.function('person').function('delete').call({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        result.success;
        expect(await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child(personId.guidString).exists()).to.be.equal(false);
        expect(await firebaseApp.database.child('clubs').child(clubId.guidString).child('fines').child(fineId.guidString).exists()).to.be.equal(false);
        expect(await getInvitationLinkId(clubId, personId)).to.be.equal(null);
        const databasePersonChange = await firebaseApp.database.child('clubs').child(clubId.guidString).child('changes').child('persons').child(personId.guidString).get();
        expect(UtcDate.decode(databasePersonChange).setted({ hour: 0, minute: 0 })).to.be.deep.equal(UtcDate.now.setted({ hour: 0, minute: 0 }));
        const databaseFineChange = await firebaseApp.database.child('clubs').child(clubId.guidString).child('changes').child('fines').child(fineId.guidString).get();
        expect(UtcDate.decode(databaseFineChange).setted({ hour: 0, minute: 0 })).to.be.deep.equal(UtcDate.now.setted({ hour: 0, minute: 0 }));
    });

    it('delete registered existing', async () => {
        const personId = new Guid('76025DDE-6893-46D2-BC34-9864BB5B8DAD');
        const result = await firebaseApp.functions.function('person').function('delete').call({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
        result.failure.equal({
            code: 'unavailable',
            message: 'Cannot delete registered person.'
        });
    });
});
