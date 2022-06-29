import { assert, expect } from 'chai';
import { signOut } from 'firebase/auth';
import { functionCallKey } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import { Logger } from '../src/Logger';
import { auth, callFunction, firebaseError, signInTestUser } from './utils';
import { DatabaseType } from '../src/TypeDefinitions/DatabaseType';

describe('GetClubId', () => {

    const logger = Logger.start(true, 'getClubIdTest', {}, 'notice');

    const clubId = guid.fromString('3210bbc6-c1b4-4e6f-8919-77f01aa10749', logger.nextIndent);

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

    it('No identifier', async () => {
        try {
            await callFunction('getClubId', {
                privateKey: functionCallKey(new DatabaseType('testing')),
                databaseType: 'testing',
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse \'identifier\'. Expected type \'string\', but got undefined or null.',
            });
        }
    });

    it('With existsting identifier', async () => {
        const httpResult = await callFunction('getClubId', {
            privateKey: functionCallKey(new DatabaseType('testing')),
            databaseType: 'testing',
            identifier: 'demo-team',
        });
        expect(httpResult.data).to.be.equal(clubId.guidString);
    });

    it('With not existsting identifier', async () => {
        try {
            await callFunction('getClubId', {
                privateKey: functionCallKey(new DatabaseType('testing')),
                databaseType: 'testing',
                identifier: 'invalid',
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/not-found',
                message: 'Club doesn\'t exists.',
            });
        }
    });
});
