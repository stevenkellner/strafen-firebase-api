import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';

describe('reasonTemplateEdit', () => {
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
        const result = await firebaseApp.functions.function('reasonTemplate').function('edit').call({
            clubId: clubId.guidString,
            editType: 'delete',
            reasonTemplateId: reasonTemplateId.guidString,
            reasonTemplate: undefined
        });
        result.success;
    });

    it('delete existing', async () => {
        const reasonTemplateId = new Guid('062FB0CB-F730-497B-BCF5-A4F907A6DCD5');
        const result = await firebaseApp.functions.function('reasonTemplate').function('edit').call({
            clubId: clubId.guidString,
            editType: 'delete',
            reasonTemplateId: reasonTemplateId.guidString,
            reasonTemplate: undefined
        });
        result.success;
        expect(await firebaseApp.database.child('clubs').child(clubId.guidString).child('reasonTemplates').child(reasonTemplateId.guidString).exists()).to.be.equal(false);
    });

    it('add not given over', async () => {
        const reasonTemplateId = Guid.newGuid();
        const result = await firebaseApp.functions.function('reasonTemplate').function('edit').call({
            clubId: clubId.guidString,
            editType: 'add',
            reasonTemplateId: reasonTemplateId.guidString,
            reasonTemplate: undefined
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'No reason template in parameters to add / update.'
        });
    });

    it('add not existing', async () => {
        const reasonTemplateId = Guid.newGuid();
        const result = await firebaseApp.functions.function('reasonTemplate').function('edit').call({
            clubId: clubId.guidString,
            editType: 'add',
            reasonTemplateId: reasonTemplateId.guidString,
            reasonTemplate: {
                reasonMessage: 'test-message-1',
                amount: 9.50,
                importance: 'low'
            }
        });
        result.success;
        const databasereasonTemplate = await firebaseApp.database.child('clubs').child(clubId.guidString).child('reasonTemplates').child(reasonTemplateId.guidString).get('decrypt');
        expect(databasereasonTemplate).to.be.deep.equal({
            reasonMessage: 'test-message-1',
            amount: 9.50,
            importance: 'low'
        });
    });

    it('add existing', async () => {
        const reasonTemplateId = new Guid('062FB0CB-F730-497B-BCF5-A4F907A6DCD5');
        const result = await firebaseApp.functions.function('reasonTemplate').function('edit').call({
            clubId: clubId.guidString,
            editType: 'add',
            reasonTemplateId: reasonTemplateId.guidString,
            reasonTemplate: {
                reasonMessage: 'test-message-1',
                amount: 9.50,
                importance: 'low'
            }
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t add existing reason template.'
        });
    });

    it('update not given over', async () => {
        const reasonTemplateId = Guid.newGuid();
        const result = await firebaseApp.functions.function('reasonTemplate').function('edit').call({
            clubId: clubId.guidString,
            editType: 'update',
            reasonTemplateId: reasonTemplateId.guidString,
            reasonTemplate: undefined
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'No reason template in parameters to add / update.'
        });
    });

    it('update not existing', async () => {
        const reasonTemplateId = Guid.newGuid();
        const result = await firebaseApp.functions.function('reasonTemplate').function('edit').call({
            clubId: clubId.guidString,
            editType: 'update',
            reasonTemplateId: reasonTemplateId.guidString,
            reasonTemplate: {
                reasonMessage: 'test-message-1',
                amount: 9.50,
                importance: 'low'
            }
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t update not existing reason template.'
        });
    });

    it('update existing', async () => {
        const reasonTemplateId = new Guid('062FB0CB-F730-497B-BCF5-A4F907A6DCD5');
        const result = await firebaseApp.functions.function('reasonTemplate').function('edit').call({
            clubId: clubId.guidString,
            editType: 'update',
            reasonTemplateId: reasonTemplateId.guidString,
            reasonTemplate: {
                reasonMessage: 'test-message-1',
                amount: 9.50,
                importance: 'high'
            }
        });
        result.success;
        const databasereasonTemplate = await firebaseApp.database.child('clubs').child(clubId.guidString).child('reasonTemplates').child(reasonTemplateId.guidString).get('decrypt');
        expect(databasereasonTemplate).to.be.deep.equal({
            reasonMessage: 'test-message-1',
            amount: 9.50,
            importance: 'high'
        });
    });
});
