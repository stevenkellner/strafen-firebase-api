import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';

describe('reasonTemplateUpdate', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('update not existing', async () => {
        const reasonTemplateId = Guid.newGuid();
        const result = await firebaseApp.functions.function('reasonTemplate').function('update').call({
            clubId: clubId.guidString,
            reasonTemplate: {
                id: reasonTemplateId.guidString,
                reasonMessage: 'test-message-1',
                amount: 9.50,
                counts: null
            }
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t update not existing reason template.'
        });
    });

    it('update existing', async () => {
        const reasonTemplateId = new Guid('062FB0CB-F730-497B-BCF5-A4F907A6DCD5');
        const result = await firebaseApp.functions.function('reasonTemplate').function('update').call({
            clubId: clubId.guidString,
            reasonTemplate: {
                id: reasonTemplateId.guidString,
                reasonMessage: 'test-message-1',
                amount: 9.50,
                counts: {
                    item: 'minute',
                    maxCount: 5
                }
            }
        });
        result.success;
        const databasereasonTemplate = await firebaseApp.database.child('clubs').child(clubId.guidString).child('reasonTemplates').child(reasonTemplateId.guidString).get('decrypt');
        expect(databasereasonTemplate).to.be.deep.equal({
            reasonMessage: 'test-message-1',
            amount: 9.50,
            counts: {
                item: 'minute',
                maxCount: 5
            }
        });
    });
});
