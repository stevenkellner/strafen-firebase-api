import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';
import { UtcDate } from 'firebase-function';

describe('personMakeManager', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('person not found', async () => {
        const result = await firebaseApp.functions.function('person').function('makeManager').call({
            clubId: clubId.guidString,
            personId: Guid.newGuid().guidString
        });
        result.failure.equal({
            code: 'not-found',
            message: 'Couldn\'t make person manager. Person not found.'
        });
    });

    it('person not signed in', async () => {
        const result = await firebaseApp.functions.function('person').function('makeManager').call({
            clubId: clubId.guidString,
            personId: new Guid('D1852AC0-A0E2-4091-AC7E-CB2C23F708D9').guidString
        });
        result.failure.equal({
            code: 'unavailable',
            message: 'Couldn\'t make person manager. Person is not signed in.'
        });
    });

    it('make manager', async () => {
        const result = await firebaseApp.functions.function('person').function('makeManager').call({
            clubId: clubId.guidString,
            personId: new Guid('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7').guidString
        });
        result.success;
        expect(await firebaseApp.database.child('clubs').child(clubId.guidString).child('authentication').child('clubManager').child('sha_xyz').get()).to.be.equal('authenticated');
        const databasePersonChange = await firebaseApp.database.child('clubs').child(clubId.guidString).child('changes').child('persons').child('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7').get();
        expect(UtcDate.decode(databasePersonChange.slice(0, 16)).setted({ hour: 0, minute: 0 })).to.be.deep.equal(UtcDate.now.setted({ hour: 0, minute: 0 }));
    });
});
