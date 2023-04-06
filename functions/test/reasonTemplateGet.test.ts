import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';
import * as defaultTestClub from '../src/testClubs/default.json';
import { type ReasonTemplate } from '../src/types/ReasonTemplate';

describe('reasonTemplateGet', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('get null reasonTemplates', async () => {
        await firebaseApp.database.child('clubs').child(clubId.guidString).child('reasonTemplates').remove();
        const result = await firebaseApp.functions.function('reasonTemplate').function('get').call({
            clubId: clubId.guidString
        });
        result.success.equal({});
    });

    it('get empty reasonTemplates', async () => {
        await firebaseApp.database.child('clubs').child(clubId.guidString).child('reasonTemplates').set({});
        const result = await firebaseApp.functions.function('reasonTemplate').function('get').call({
            clubId: clubId.guidString
        });
        result.success.equal({});
    });

    it('get reasonTemplates', async () => {
        const result = await firebaseApp.functions.function('reasonTemplate').function('get').call({
            clubId: clubId.guidString
        });
        result.success.equal(defaultTestClub.reasonTemplates as Record<string, Omit<ReasonTemplate.Flatten, 'id'>>);
    });
});
