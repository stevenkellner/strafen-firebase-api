import { signOut } from 'firebase/auth';
import { unhashedFunctionCallKey } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import { Logger } from '../src/Logger';
import { DatabaseType } from '../src/TypeDefinitions/DatabaseType';
import { auth, callFunction, signInTestUser, expectFunctionSuccess, expectFunctionFailed } from './utils';

describe('GetPersonProperties', () => {

    const logger = Logger.start(true, 'getPersonPropertiesTest', {}, 'notice');

    const clubId = guid.fromString('7760bbc6-c1b4-4e6f-8919-77f01aa10749', logger.nextIndent);

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
        const callResult = await callFunction('getPersonProperties', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'userId\'. Expected type \'string\', but got undefined or null.',
        });
    });

    it('With existsting identifier', async () => {
        const callResult = await callFunction('getPersonProperties', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            userId: 'LpAaeCz0BQfDHVYw02KiCyoTMS13',
        });
        expectFunctionSuccess(callResult).to.be.deep.equal({
            clubProperties: {
                id: clubId.guidString,
                identifier: 'demo-team',
                inAppPaymentActive: true,
                name: 'Neuer Verein',
                regionCode: 'DE',
            },
            personProperties: {
                id: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                isAdmin: true,
                name: {
                    first: 'Max',
                    last: 'Mustermann',
                },
                signInDate: '2011-09-13T10:42:38.000Z',
            },
        });
    });

    it('With not existsting identifier', async () => {
        const callResult = await callFunction('getPersonProperties', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            userId: 'invalid',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'not-found',
            message: 'Person doesn\'t exist.',
        });
    });
});
