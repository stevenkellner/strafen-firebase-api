import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';

describe('personUpdate', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('update not existing', async () => {
        const personId = Guid.newGuid();
        const result = await firebaseApp.functions.function('person').function('update').call({
            clubId: clubId.guidString,
            person: {
                id: personId.guidString,
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
        const result = await firebaseApp.functions.function('person').function('update').call({
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
            fineIds: ['1B5F958E-9D7D-46E1-8AEE-F52F4370A95A'],
            signInData: {
                hashedUserId: 'sha_xyz',
                signInDate: '2022-01-26T17:23:45.678+01:00',
                authentication: ['clubMember'],
                notificationTokens: {}
            },
            isInvited: false
        });
    });
});