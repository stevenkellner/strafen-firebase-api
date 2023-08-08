import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';
import * as defaultTestClub from '../src/testClubs/default.json';

describe('personGetChanges', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('get changes', async () => {
        const result = await firebaseApp.functions.function('person').function('getChanges').call({
            clubId: clubId.guidString
        });
        const invitationLinkIds: Record<string, string> = {};
        if (result.success) {
            for (const person of result.success.value) {
                if (!('deleted' in person) && person.invitationLinkId !== null)
                    invitationLinkIds[person.id] = person.invitationLinkId;
            }
        }
        result.success.unsorted([
            {
                id: 'D1852AC0-A0E2-4091-AC7E-CB2C23F708D9',
                ...defaultTestClub.persons['D1852AC0-A0E2-4091-AC7E-CB2C23F708D9'],
                invitationLinkId: invitationLinkIds['D1852AC0-A0E2-4091-AC7E-CB2C23F708D9']
            },
            {
                deleted: '20DC6151-F666-42DA-BE75-3DCC95A6118A'
            }
        ]);        
    });

    it('get empty changes', async () => {
        await firebaseApp.database.child('clubs').child(clubId.guidString).child('changes').child('persons').set({});
        const result = await firebaseApp.functions.function('person').function('getChanges').call({
            clubId: clubId.guidString
        });
        result.success.equal([]);
    });
});
