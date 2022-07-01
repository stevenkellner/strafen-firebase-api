import { expect } from 'chai';
import { signOut } from 'firebase/auth';
import { unhashedFunctionCallKey } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import { Logger } from '../src/Logger';
import { DatabaseType } from '../src/TypeDefinitions/DatabaseType';
import {
    auth, callFunction, getDatabaseOptionalValue, signInTestUser, expectFunctionSuccess, expectFunctionFailed,
} from './utils';

describe('ForceSignOut', () => {

    const logger = Logger.start(true, 'forceSignOutTest', {}, 'notice');

    const clubId = guid.fromString('32c0bbc6-c1b4-4e6f-8919-77f01aa10749', logger.nextIndent);

    beforeEach(async () => {
        await signInTestUser();
        const callResult = await callFunction('newTestClub', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            testClubType: 'default',
        });
        expectFunctionSuccess(callResult).to.be.equal(undefined);
    });

    afterEach(async () => {
        const callResult = await callFunction('deleteTestClubs', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
        });
        expectFunctionSuccess(callResult).to.be.equal(undefined);
        await signOut(auth);
    });

    it('No club id', async () => {
        const callResult = await callFunction('forceSignOut', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            personId: guid.newGuid().guidString,
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'clubId\'. Expected type \'string\', but got undefined or null.',
        });
    });

    it('No person id', async () => {
        const callResult = await callFunction('forceSignOut', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'personId\'. Expected type \'string\', but got undefined or null.',
        });
    });

    it('With signed in person', async () => {
        const personId = '76025DDE-6893-46D2-BC34-9864BB5B8DAD';
        const callResult = await callFunction('forceSignOut', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            personId: personId,
        });
        expectFunctionSuccess(callResult).to.be.equal(undefined);

        // Check sign in data
        const signInData = await getDatabaseOptionalValue(`${clubId.guidString}/persons/${personId}/signInData`);
        expect(signInData).to.be.null;

        // Check person ids
        const fetchedPersonId = await getDatabaseOptionalValue(`${clubId.guidString}/personUserIds/asdnfl`);
        expect(fetchedPersonId).to.be.null;
    });

    it('No signed in person', async () => {

        // Nothing should happen
        const callResult = await callFunction('forceSignOut', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            personId: guid.newGuid().guidString,
        });
        expectFunctionSuccess(callResult).to.be.equal(undefined);
    });
});
