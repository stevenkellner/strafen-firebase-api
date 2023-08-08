import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';
import * as defaultTestClub from '../src/testClubs/default.json';
import { ReasonTemplate } from '../src/types/ReasonTemplate';

describe('reasonTemplateGetChanges', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('get changes', async () => {
        const result = await firebaseApp.functions.function('reasonTemplate').function('getChanges').call({
            clubId: clubId.guidString
        });
        result.success.unsorted([
            {
                id: '062FB0CB-F730-497B-BCF5-A4F907A6DCD5',
                ...defaultTestClub.reasonTemplates['062FB0CB-F730-497B-BCF5-A4F907A6DCD5']
            },
            {
                id: '16805D21-5E8D-43E9-BB5C-7B4A790F0CE7',
                ...defaultTestClub.reasonTemplates['16805D21-5E8D-43E9-BB5C-7B4A790F0CE7'] as Omit<ReasonTemplate.Flatten, 'id'>
            },
            {
                deleted: '3EAF4C79-185F-4A26-A80B-9A252769EA41'
            }
        ]);        
    });

    it('get empty changes', async () => {
        await firebaseApp.database.child('clubs').child(clubId.guidString).child('changes').child('reasonTemplates').set({});
        const result = await firebaseApp.functions.function('reasonTemplate').function('getChanges').call({
            clubId: clubId.guidString
        });
        result.success.equal([]);
    });
});
