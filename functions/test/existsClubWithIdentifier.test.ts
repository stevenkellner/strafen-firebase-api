import { assert, expect } from 'chai';
import { signOut } from 'firebase/auth';
import { privateKey } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import { Logger } from '../src/Logger';
import { ParameterContainer } from '../src/ParameterContainer';
import { auth, callFunction, firebaseError, signInTestUser } from './utils';

describe('ExistsClubWithIdentifier', () => {

    const logger =
        Logger.start(new ParameterContainer({ verbose: true }), 'existsClubWithIdentifierTest', {}, 'notice');

    const clubId = guid.fromString('1a20bbc6-c1b4-4e6f-8919-77f01aa10749', logger.nextIndent);

    beforeEach(async () => {
        await signInTestUser();
        await callFunction('newTestClub', {
            privateKey: privateKey,
            databaseType: 'testing',
            clubId: clubId.guidString,
            testClubType: 'default',
        });
    });

    afterEach(async () => {
        await callFunction('deleteTestClubs', {
            privateKey: privateKey,
            databaseType: 'testing',
        });
        await signOut(auth);
    });

    it('No identifier', async () => {
        try {
            await callFunction('existsClubWithIdentifier', {
                privateKey: privateKey,
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
        const httpResult = await callFunction('existsClubWithIdentifier', {
            privateKey: privateKey,
            databaseType: 'testing',
            identifier: 'demo-team',
        });
        expect(httpResult.data).to.be.true;
    });

    it('With not existsting identifier', async () => {
        const httpResult = await callFunction('existsClubWithIdentifier', {
            privateKey: privateKey,
            databaseType: 'testing',
            identifier: 'invalid',
        });
        expect(httpResult.data).to.be.false;
    });
});
