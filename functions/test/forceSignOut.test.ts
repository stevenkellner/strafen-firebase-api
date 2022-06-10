import { assert, expect } from 'chai';
import { signOut } from 'firebase/auth';
import { privateKey } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import { Logger } from '../src/TypeDefinitions/LoggingProperties';
import { ParameterContainer } from '../src/TypeDefinitions/ParameterContainer';
import { auth, callFunction, firebaseError, getDatabaseOptionalValue, signInTestUser } from './utils';

describe('ForceSignOut', () => {

    const loggingProperties = Logger.withFirst(new ParameterContainer({ verbose: true }), 'forceSignOutTest', undefined, 'notice');

    const clubId = guid.fromString('32c0bbc6-c1b4-4e6f-8919-77f01aa10749', loggingProperties.nextIndent);

    beforeEach(async () => {
        await signInTestUser();
        await callFunction('newTestClub', {
            privateKey: privateKey,
            clubLevel: 'testing',
            clubId: clubId.guidString,
            testClubType: 'default',
        });
    });

    afterEach(async () => {
        await callFunction('deleteTestClubs', {
            privateKey: privateKey,
            clubLevel: 'testing',
        });
        await signOut(auth);
    });

    it('No club id', async () => {
        try {
            await callFunction('forceSignOut', {
                privateKey: privateKey,
                clubLevel: 'testing',
                personId: guid.newGuid().guidString,
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse \'clubId\'. Expected type \'string\', but got undefined or null.',
            });
        }
    });

    it('No person id', async () => {
        try {
            await callFunction('forceSignOut', {
                privateKey: privateKey,
                clubLevel: 'testing',
                clubId: clubId.guidString,
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse \'personId\'. Expected type \'string\', but got undefined or null.',
            });
        }
    });

    it('With signed in person', async () => {
        const personId = '76025DDE-6893-46D2-BC34-9864BB5B8DAD';
        await callFunction('forceSignOut', {
            privateKey: privateKey,
            clubLevel: 'testing',
            clubId: clubId.guidString,
            personId: personId,
        });

        // Check sign in data
        const signInData = await getDatabaseOptionalValue(`testableClubs/${clubId.guidString}/persons/${personId}/signInData`);
        expect(signInData).to.be.null;

        // Check person ids
        const fetchedPersonId = await getDatabaseOptionalValue(`testableClubs/${clubId.guidString}/personUserIds/asdnfl`);
        expect(fetchedPersonId).to.be.null;
    });

    it('No signed in person', async () => {

        // Nothing should happen
        await callFunction('forceSignOut', {
            privateKey: privateKey,
            clubLevel: 'testing',
            clubId: clubId.guidString,
            personId: guid.newGuid().guidString,
        });
    });
});
