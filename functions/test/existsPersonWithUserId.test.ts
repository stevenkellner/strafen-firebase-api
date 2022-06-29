import { assert, expect } from 'chai';
import { signOut } from 'firebase/auth';
import { functionCallKey } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import { Logger } from '../src/Logger';
import { DatabaseType } from '../src/TypeDefinitions/DatabaseType';
import { auth, callFunction, firebaseError, signInTestUser } from './utils';

describe('ExistsPersonWithUserId', () => {

    const loggingProperties =
        Logger.start(true, 'existsPersonWithUserIdTest', {}, 'notice');

    const clubId = guid.fromString('48a0bbc6-c1b4-4e6f-8919-77f01aa10749', loggingProperties.nextIndent);

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
            await callFunction('existsPersonWithUserId', {
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

    it('With existsting user id', async () => {
        const httpResult = await callFunction('existsPersonWithUserId', {
            privateKey: functionCallKey(new DatabaseType('testing')),
            databaseType: 'testing',
            userId: 'LpAaeCz0BQfDHVYw02KiCyoTMS13',
        });
        expect(httpResult.data).to.be.true;
    });

    it('With not existsting user id', async () => {
        const httpResult = await callFunction('existsPersonWithUserId', {
            privateKey: functionCallKey(new DatabaseType('testing')),
            databaseType: 'testing',
            userId: 'invalid',
        });
        expect(httpResult.data).to.be.false;
    });
});
