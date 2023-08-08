import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';
import * as defaultTestClub from '../src/testClubs/default.json';
import { mapValues } from './utils';
import { type TestClub } from '../src/types/TestClubType';

describe('personGet', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('get null persons', async () => {
        await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').remove();
        const result = await firebaseApp.functions.function('person').function('get').call({
            clubId: clubId.guidString
        });
        result.success.equal({});
    });

    it('get empty persons', async () => {
        await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').set({});
        const result = await firebaseApp.functions.function('person').function('get').call({
            clubId: clubId.guidString
        });
        result.success.equal({});
    });

    it('get persons', async () => {
        const result = await firebaseApp.functions.function('person').function('get').call({
            clubId: clubId.guidString
        });
        const invitationLinkIds: Record<string, string> = {};
        if (result.success) {
            for (const person of Object.values(result.success.value)) {
                if (person.invitationLinkId !== null)
                    invitationLinkIds[person.id] = person.invitationLinkId;
            }
        }
        result.success.equal(mapValues(defaultTestClub.persons as TestClub['persons'], entry => {
            if (entry[0] in invitationLinkIds)
                entry[1].invitationLinkId = invitationLinkIds[entry[0]];
            return {
                id: entry[0],
                ...entry[1]
            };
        }));
    });
});
