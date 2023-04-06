import { expect } from 'firebase-function/lib/src/testUtils';
import { Amount } from '../src/types/Amount';
import { Fine } from '../src/types/Fine';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';

describe('personEdit', () => {
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
        const result = await firebaseApp.functions.function('person').function('edit').call({
            clubId: clubId.guidString,
            editType: 'delete',
            personId: personId.guidString,
            person: undefined
        });
        result.success;
    });

    it('delete existing', async () => {
        const personId = new Guid('D1852AC0-A0E2-4091-AC7E-CB2C23F708D9');
        const fineId = Guid.newGuid();
        const fine: Omit<Fine, 'id'> = {
            personId: personId,
            number: 1,
            date: new Date(),
            fineReason: {
                reasonMessage: 'asdf',
                amount: new Amount(1, 50),
                importance: 'medium'
            },
            payedState: {
                state: 'unpayed'
            }
        };
        await firebaseApp.database.child('clubs').child(clubId.guidString).child('fines').child(fineId.guidString).set(Fine.flatten(fine), 'encrypt');
        const person = await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child(personId.guidString).get('decrypt');
        person.fineIds.push(fineId.guidString);
        await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child(personId.guidString).set(person, 'encrypt');
        const result = await firebaseApp.functions.function('person').function('edit').call({
            clubId: clubId.guidString,
            editType: 'delete',
            personId: personId.guidString,
            person: undefined
        });
        result.success;
        expect(await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child(personId.guidString).exists()).to.be.equal(false);
        expect(await firebaseApp.database.child('clubs').child(clubId.guidString).child('fines').child(fineId.guidString).exists()).to.be.equal(false);
    });

    it('delete registered existing', async () => {
        const personId = new Guid('76025DDE-6893-46D2-BC34-9864BB5B8DAD');
        const result = await firebaseApp.functions.function('person').function('edit').call({
            clubId: clubId.guidString,
            editType: 'delete',
            personId: personId.guidString,
            person: undefined
        });
        result.failure.equal({
            code: 'unavailable',
            message: 'Cannot delete registered person.'
        });
    });

    it('add not given over', async () => {
        const personId = Guid.newGuid();
        const result = await firebaseApp.functions.function('person').function('edit').call({
            clubId: clubId.guidString,
            editType: 'add',
            personId: personId.guidString,
            person: undefined
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'No person name in parameters to add / update.'
        });
    });

    it('add not existing', async () => {
        const personId = Guid.newGuid();
        const result = await firebaseApp.functions.function('person').function('edit').call({
            clubId: clubId.guidString,
            editType: 'add',
            personId: personId.guidString,
            person: {
                name: { first: 'lk', last: 'uioz' }
            }
        });
        result.success;
        const databasePerson = await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child(personId.guidString).get('decrypt');
        expect(databasePerson).to.be.deep.equal({
            name: { first: 'lk', last: 'uioz' },
            fineIds: [],
            signInData: null
        });
    });

    it('add existing', async () => {
        const personId = new Guid('D1852AC0-A0E2-4091-AC7E-CB2C23F708D9');
        const result = await firebaseApp.functions.function('person').function('edit').call({
            clubId: clubId.guidString,
            editType: 'add',
            personId: personId.guidString,
            person: {
                name: { first: 'lk', last: 'uioz' }
            }
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t add existing person.'
        });
    });

    it('update not given over', async () => {
        const personId = Guid.newGuid();
        const result = await firebaseApp.functions.function('person').function('edit').call({
            clubId: clubId.guidString,
            editType: 'update',
            personId: personId.guidString,
            person: undefined
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'No person name in parameters to add / update.'
        });
    });

    it('update not existing', async () => {
        const personId = Guid.newGuid();
        const result = await firebaseApp.functions.function('person').function('edit').call({
            clubId: clubId.guidString,
            editType: 'update',
            personId: personId.guidString,
            person: {
                name: { first: 'lk', last: 'uioz' }
            }
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t update not existing person.'
        });
    });

    it('update existing', async () => {
        const personId = new Guid('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7');
        const result = await firebaseApp.functions.function('person').function('edit').call({
            clubId: clubId.guidString,
            editType: 'update',
            personId: personId.guidString,
            person: {
                name: { first: 'lk', last: 'uioz' }
            }
        });
        result.success;
        const databasePerson = await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child(personId.guidString).get('decrypt');
        expect(databasePerson).to.be.deep.equal({
            name: { first: 'lk', last: 'uioz' },
            fineIds: ['1B5F958E-9D7D-46E1-8AEE-F52F4370A95A'],
            signInData: {
                hashedUserId: 'sha_xyz',
                signInDate: '2022-01-26T17:23:45.678+01:00'
            }
        });
    });
});
