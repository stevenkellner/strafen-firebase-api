import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';
import * as defaultTestClub from '../src/testClubs/default.json';
import { type ReasonTemplate } from '../src/types/ReasonTemplate';

describe('reasonTemplateGetSingle', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('get reasonTemplate', async () => {
        const result = await firebaseApp.functions.function('reasonTemplate').function('getSingle').call({
            clubId: clubId.guidString,
            reasonTemplateId: Guid.newGuid().guidString
        });
        result.success.equal(null);
    });

    it('get not existing reasonTemplate', async () => {
        const reasonTemplateId = '062FB0CB-F730-497B-BCF5-A4F907A6DCD5' as const;
        const result = await firebaseApp.functions.function('reasonTemplate').function('getSingle').call({
            clubId: clubId.guidString,
            reasonTemplateId: reasonTemplateId
        });
        result.success.equal({
            id: reasonTemplateId,
            ...defaultTestClub.reasonTemplates[reasonTemplateId] as Omit<ReasonTemplate.Flatten, 'id'>
        });
    });
});
