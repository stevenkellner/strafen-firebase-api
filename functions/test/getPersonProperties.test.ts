import { assert, expect } from 'chai';
import { signOut } from 'firebase/auth';
import { functionCallKey } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import { Logger } from '../src/Logger';
import { DatabaseType } from '../src/TypeDefinitions/DatabaseType';
import { auth, callFunction, firebaseError, signInTestUser } from './utils';

describe('GetPersonProperties', () => {

    const logger = Logger.start(true, 'getPersonPropertiesTest', {}, 'notice');

    const clubId = guid.fromString('7760bbc6-c1b4-4e6f-8919-77f01aa10749', logger.nextIndent);

    beforeEach(async () => {
        await signInTestUser();
        await callFunction('newTestClub', {
            privateKey: functionCallKey(new DatabaseType('testing')),
            databaseType: 'testing',
            clubId: clubId.guidString,
            testClubType: 'default',
        });
    });

    afterEach(async () => {
        await callFunction('deleteTestClubs', {
            privateKey: functionCallKey(new DatabaseType('testing')),
            databaseType: 'testing',
        });
        await signOut(auth);
    });

    it('No user id', async () => {
        try {
            await callFunction('getPersonProperties', {
                privateKey: functionCallKey(new DatabaseType('testing')),
                databaseType: 'testing',
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse \'userId\'. Expected type \'string\', but got undefined or null.',
            });
        }
    });

    it('With existsting identifier', async () => {
        const httpResult = await callFunction('getPersonProperties', {
            privateKey: functionCallKey(new DatabaseType('testing')),
            databaseType: 'testing',
            userId: 'LpAaeCz0BQfDHVYw02KiCyoTMS13',
        });
        expect(httpResult.data).to.be.deep.equal({
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
        try {
            await callFunction('getPersonProperties', {
                privateKey: functionCallKey(new DatabaseType('testing')),
                databaseType: 'testing',
                userId: 'invalid',
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/not-found',
                message: 'Person doesn\'t exist.',
            });
        }
    });
});
