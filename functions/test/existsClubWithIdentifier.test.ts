import { signOut } from 'firebase/auth';
import { unhashedFunctionCallKey } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import { Logger } from '../src/Logger';
import { auth, callFunction, signInTestUser, expectFunctionSuccess, expectFunctionFailed } from './utils';
import { DatabaseType } from '../src/TypeDefinitions/DatabaseType';

describe('ExistsClubWithIdentifier', () => {

    const logger =
        Logger.start(true, 'existsClubWithIdentifierTest', {}, 'notice');

    const clubId = guid.fromString('1a20bbc6-c1b4-4e6f-8919-77f01aa10749', logger.nextIndent);

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

    it('No identifier', async () => {
        const callResult = await callFunction('existsClubWithIdentifier', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'identifier\'. Expected type \'string\', but got undefined or null.',
        });
    });

    it('With existsting identifier', async () => {
        const callResult = await callFunction('existsClubWithIdentifier', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            identifier: 'demo-team',
        });
        expectFunctionSuccess(callResult).to.be.equal(true);
    });

    it('With not existsting identifier', async () => {
        const callResult = await callFunction('existsClubWithIdentifier', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            identifier: 'invalid',
        });
        expectFunctionSuccess(callResult).to.be.equal(false);
    });
});
