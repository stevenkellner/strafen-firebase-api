import { expect } from 'chai';
import { signOut } from 'firebase/auth';
import { unhashedFunctionCallKey, cryptionKeys } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import { Logger } from '../src/Logger';
import { PersonName } from '../src/TypeDefinitions/PersonName';
import { PersonPropertiesWithUserId } from '../src/TypeDefinitions/PersonPropertiesWithUserId';
import {
    auth, callFunction, getDatabaseValue, signInTestUser, expectFunctionSuccess, expectFunctionFailed,
} from './utils';
import { DatabaseType } from '../src/TypeDefinitions/DatabaseType';
import { Crypter } from '../src/crypter/Crypter';

describe('RegisterPerson', () => {

    const logger = Logger.start(true, 'registerPersonTest', {}, 'notice');

    const clubId = guid.fromString('aab0bbc6-c1b4-4e6f-8919-77f01aa10749', logger.nextIndent);

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
        const personId = guid.newGuid();
        const callResult = await callFunction('registerPerson', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            personProperties: new PersonPropertiesWithUserId(
                personId,
                new Date(),
                'userId-123',
                new PersonName('first name', 'last name')
            ).databaseObject,
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'clubId\'. Expected type \'string\', but got undefined or null.',
        });
    });

    it('No person properties', async () => {
        const callResult = await callFunction('registerPerson', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'personProperties\'. Expected type \'object\', but got undefined or null.',
        });
    });

    it('Register new person', async () => {

        // Register person
        const personId = guid.newGuid();
        const signInDate = new Date();
        const callResult = await callFunction('registerPerson', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            personProperties: new PersonPropertiesWithUserId(
                personId,
                signInDate,
                'userId-123',
                new PersonName('first name', 'last name')
            ).databaseObject,
        });

        // Check return value
        expectFunctionSuccess(callResult).to.be.deep.equal({
            id: clubId.guidString,
            identifier: 'demo-team',
            inAppPaymentActive: true,
            name: 'Neuer Verein',
            regionCode: 'DE',
        });

        // Check database person user ids
        const fetchedPersonId = await getDatabaseValue(`${clubId.guidString}/personUserIds/userId-123`);
        expect(fetchedPersonId).to.be.equal(personId.guidString);

        // Check database person
        const crypter = new Crypter(cryptionKeys(new DatabaseType('testing')));
        const fetchedPerson =
            await getDatabaseValue(`${clubId.guidString}/persons/${personId.guidString}`);
        expect(crypter.decryptDecode(fetchedPerson)).to.be.deep.equal({
            name: {
                first: 'first name',
                last: 'last name',
            },
            signInData: {
                admin: false,
                signInDate: signInDate.toISOString(),
                userId: 'userId-123',
            },
        });
    });
});
