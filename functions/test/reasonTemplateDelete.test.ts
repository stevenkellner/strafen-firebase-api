import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';

describe('reasonTemplateDelete', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('delete not existing', async () => {
        const reasonTemplateId = Guid.newGuid();
        const result = await firebaseApp.functions.function('reasonTemplate').function('delete').call({
            clubId: clubId.guidString,
            reasonTemplateId: reasonTemplateId.guidString
        });
        result.success;
    });

    it('delete existing', async () => {
        const reasonTemplateId = new Guid('062FB0CB-F730-497B-BCF5-A4F907A6DCD5');
        const result = await firebaseApp.functions.function('reasonTemplate').function('delete').call({
            clubId: clubId.guidString,
            reasonTemplateId: reasonTemplateId.guidString
        });
        result.success;
        expect(await firebaseApp.database.child('clubs').child(clubId.guidString).child('reasonTemplates').child(reasonTemplateId.guidString).exists()).to.be.equal(false);
    });
});
