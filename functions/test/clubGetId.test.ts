import { Guid } from '../src/types/Guid';
import { createTestClub, cleanUpFirebase, authenticateTestUser, firebaseApp } from './firebaseApp';

describe('clubGetId', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('existing identifier', async () => {
        const result = await firebaseApp.functions.function('club').function('getId').call({
            identifier: 'demo-team'
        });
        result.success.equal(clubId.guidString);
    });

    it('not existing identifier', async () => {
        const result = await firebaseApp.functions.function('club').function('getId').call({
            identifier: 'invalid-team'
        });
        result.failure.equal({
            code: 'not-found',
            message: 'Club doesn\'t exist.'
        });
    });
});
