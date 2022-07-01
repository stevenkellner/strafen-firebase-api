import { signOut } from 'firebase/auth';
import { unhashedFunctionCallKey } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import { Logger } from '../src/Logger';
import { DatabaseType } from '../src/TypeDefinitions/DatabaseType';
import { auth, callFunction, signInTestUser, expectFunctionSuccess, expectFunctionFailed } from './utils';

describe('ExistsPersonWithUserId', () => {

    const loggingProperties =
        Logger.start(true, 'existsPersonWithUserIdTest', {}, 'notice');

    const clubId = guid.fromString('48a0bbc6-c1b4-4e6f-8919-77f01aa10749', loggingProperties.nextIndent);

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

    it('No user id', async () => {
        const callResult = await callFunction('existsPersonWithUserId', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'userId\'. Expected type \'string\', but got undefined or null.',
        });
    });

    it('With existsting user id', async () => {
        const callResult = await callFunction('existsPersonWithUserId', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            userId: 'LpAaeCz0BQfDHVYw02KiCyoTMS13',
        });
        expectFunctionSuccess(callResult).to.be.equal(true);
    });

    it('With not existsting user id', async () => {
        const callResult = await callFunction('existsPersonWithUserId', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            userId: 'invalid',
        });
        expectFunctionSuccess(callResult).to.be.equal(false);
    });
});
