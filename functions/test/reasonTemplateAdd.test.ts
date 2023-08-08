import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';
import { UtcDate } from 'firebase-function';

describe('reasonTemplateAdd', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('add not existing', async () => {
        const reasonTemplateId = Guid.newGuid();
        const result = await firebaseApp.functions.function('reasonTemplate').function('add').call({
            clubId: clubId.guidString,
            reasonTemplate: {
                id: reasonTemplateId.guidString,
                reasonMessage: 'test-message-1',
                amount: 9.50,
                counts: {
                    item: 'item',
                    maxCount: null
                }
            }
        });
        result.success;
        const databasereasonTemplate = await firebaseApp.database.child('clubs').child(clubId.guidString).child('reasonTemplates').child(reasonTemplateId.guidString).get('decrypt');
        expect(databasereasonTemplate).to.be.deep.equal({
            reasonMessage: 'test-message-1',
            amount: 9.50,
            counts: {
                item: 'item',
                maxCount: null
            }
        });
        const databaseReasonTemplateChange = await firebaseApp.database.child('clubs').child(clubId.guidString).child('changes').child('reasonTemplates').child(reasonTemplateId.guidString).get();
        expect(UtcDate.decode(databaseReasonTemplateChange.slice(0, 16)).setted({ hour: 0, minute: 0 })).to.be.deep.equal(UtcDate.now.setted({ hour: 0, minute: 0 }));
    });

    it('add existing', async () => {
        const reasonTemplateId = new Guid('062FB0CB-F730-497B-BCF5-A4F907A6DCD5');
        const result = await firebaseApp.functions.function('reasonTemplate').function('add').call({
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
            message: 'Couldn\'t add existing reason template.'
        });
    });
});
