import { signOut } from '@firebase/auth';
import { unhashedFunctionCallKey } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import { Logger } from '../src/Logger';
import { callFunction, signInTestUser, auth, expectFunctionSuccess, expectFunctionFailed } from './utils';
import { DatabaseType } from '../src/TypeDefinitions/DatabaseType';

describe('General', () => {

    const logger = Logger.start(true, 'generalTest', {}, 'notice');

    beforeEach(async () => {
        if (auth.currentUser !== null)
            await signOut(auth);
    });

    afterEach(async () => {
        await signInTestUser();
        const callResult = await callFunction('deleteTestClubs', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
        });
        expectFunctionSuccess(callResult).to.be.equal(undefined);
        await signOut(auth);
    });

    it('No parameters', async () => {
        const callResult = await callFunction('changeFinePayed', null);
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'privateKey\'. Expected type \'string\', but got undefined or null.',
        });
    });

    it('No private key', async () => {
        const callResult = await callFunction('changeFinePayed', {});
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'privateKey\'. Expected type \'string\', but got undefined or null.',
        });
    });

    it('Invalid database type', async () => {
        const callResult = await callFunction('changeFinePayed', {
            privateKey: 'some key',
            databaseType: 'invalid type',
            clubId: guid.newGuid().guidString,
            fineId: guid.newGuid().guidString,
            state: {
                state: 'unpayed',
                updateProperties: {
                    timestamp: '2011-10-14T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            // eslint-disable-next-line max-len
            message: 'Couldn\'t parse DatabaseType, expected \'release\', \'debug\' or \'testing\', but got invalid type instead.',
        });
    });

    it('Invalid guid', async () => {
        const callResult = await callFunction('changeFinePayed', {
            privateKey: 'some key',
            databaseType: 'testing',
            clubId: 'invalid guid',
            fineId: guid.newGuid().guidString,
            state: {
                state: 'unpayed',
                updateProperties: {
                    timestamp: '2011-10-14T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse Guid, guid string isn\'t a valid Guid: invalid guid',
        });
    });

    it('Invalid private key', async () => {
        const callResult = await callFunction('changeFinePayed', {
            privateKey: 'invalidKey',
            databaseType: 'testing',
            clubId: guid.newGuid().guidString,
            fineId: guid.newGuid().guidString,
            payedState: {
                state: 'unpayed',
            },
            fineUpdateProperties: {
                timestamp: '2011-10-14T10:42:38+0000',
                personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'permission-denied',
            message: 'Private key is invalid.',
        });
    });

    it('No user signed in', async () => {
        const callResult = await callFunction('changeFinePayed', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: guid.newGuid().guidString,
            fineId: guid.newGuid().guidString,
            payedState: {
                state: 'unpayed',
            },
            fineUpdateProperties: {
                timestamp: '2011-10-14T10:42:38+0000',
                personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'permission-denied',
            message: 'The function must be called while authenticated, nobody signed in.',
        });
    });

    it('User not in club', async () => {
        await signInTestUser();
        const callResult = await callFunction('changeFinePayed', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: guid.newGuid().guidString,
            fineId: guid.newGuid().guidString,
            payedState: {
                state: 'unpayed',
            },
            fineUpdateProperties: {
                timestamp: '2011-10-14T10:42:38+0000',
                personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'permission-denied',
            message: 'The function must be called while authenticated, person not in club.',
        });
    });

    it('Older function value', async () => {
        const clubId = guid.newGuid();
        const fineId = guid.fromString('1B5F958E-9D7D-46E1-8AEE-F52F4370A95A', logger.nextIndent);
        await signInTestUser();
        const callResult1 = await callFunction('newTestClub', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            testClubType: 'default',
        });
        expectFunctionSuccess(callResult1).to.be.equal(undefined);
        const callResult2 = await callFunction('changeFinePayed', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            fineId: fineId.guidString,
            payedState: {
                state: 'unpayed',
            },
            fineUpdateProperties: {
                timestamp: '2011-10-12T10:42:38+0000',
                personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        });
        expectFunctionFailed(callResult2).to.be.deep.equal({
            code: 'cancelled',
            message: 'Server value is newer or same old than updated value.',
        });
        const callResult3 = await callFunction('deleteTestClubs', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
        });
        expectFunctionSuccess(callResult3).to.be.equal(undefined);
        await signOut(auth);
    });

    it('Same old function value', async () => {
        const clubId = guid.newGuid();
        const fineId = guid.fromString('1B5F958E-9D7D-46E1-8AEE-F52F4370A95A', logger.nextIndent);
        await signInTestUser();
        const callResult1 = await callFunction('newTestClub', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            testClubType: 'default',
        });
        expectFunctionSuccess(callResult1).to.be.equal(undefined);
        const callResult2 = await callFunction('changeFinePayed', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            fineId: fineId.guidString,
            payedState: {
                state: 'unpayed',
            },
            fineUpdateProperties: {
                timestamp: '2011-10-13T10:42:38+0000',
                personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        });
        expectFunctionFailed(callResult2).to.be.deep.equal({
            code: 'cancelled',
            message: 'Server value is newer or same old than updated value.',
        });
        const callResult3 = await callFunction('deleteTestClubs', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
        });
        expectFunctionSuccess(callResult3).to.be.equal(undefined);
        await signOut(auth);
    });
});
