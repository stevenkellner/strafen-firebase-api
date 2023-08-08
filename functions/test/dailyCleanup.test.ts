import { UtcDate } from 'firebase-function';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';
import { expect } from 'firebase-function/lib/src/testUtils';

describe('dailyCleanup', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('cleanup', async () => {
        const personId = Guid.newGuid();
        const value = `${UtcDate.now.encoded}_${Guid.newGuid().guidString.slice(0, 8)}`;
        await firebaseApp.database.child('clubs').child(clubId.guidString).child('changes').child('persons').child(personId.guidString).set(value);
        const result = await firebaseApp.functions.function('executeSchedule').call({ type: 'dailyCleanup' });
        result.success;
        const changes = await firebaseApp.database.child('clubs').child(clubId.guidString).child('changes').get();
        expect(changes.persons).to.be.deep.equal({
            [personId.guidString]: value
        });
        expect(Object.values(changes.reasonTemplates ?? {}).length).to.be.equal(0);
        expect(Object.values(changes.fines ?? {}).length).to.be.equal(0);
    });
});
