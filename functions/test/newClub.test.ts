import { unhashedFunctionCallKey, cryptionKeys } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import {
    auth, callFunction, expectFunctionFailed, getDatabaseOptionalValue,
    getDatabaseValue, signInTestUser, expectFunctionSuccess,
} from './utils';
import { signOut } from 'firebase/auth';
import { Logger } from '../src/Logger';
import { PersonPropertiesWithUserId } from '../src/TypeDefinitions/PersonPropertiesWithUserId';
import { PersonName } from '../src/TypeDefinitions/PersonName';
import { DatabaseType } from '../src/TypeDefinitions/DatabaseType';
import { ClubProperties } from '../src/TypeDefinitions/ClubProperties';
import { Crypter } from '../src/crypter/Crypter';
import { expect } from 'chai';

describe('NewClub', () => {

    const logger = Logger.start(true, 'newClubTest', {}, 'notice');

    const clubId = guid.fromString('dd129fcd-3b4b-437c-83a7-0e5433cc4cac', logger.nextIndent);

    beforeEach(async () => {
        await signInTestUser();
    });

    afterEach(async () => {
        const callResult = await callFunction('deleteTestClubs', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
        });
        expectFunctionSuccess(callResult).to.be.equal(undefined);
        await signOut(auth);
    });

    it('No club properties', async () => {
        const personId = guid.newGuid();
        const callResult = await callFunction('newClub', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            changeType: 'upate',
            personProperties: new PersonPropertiesWithUserId(
                personId,
                new Date(),
                'userId',
                new PersonName('first name', 'last name')
            ).databaseObject,
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'clubProperties\'. Expected type \'object\', but got undefined or null.',
        });
    });

    it('No person properties', async () => {
        const callResult = await callFunction('newClub', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            changeType: 'upate',
            clubProperties: new ClubProperties(
                clubId,
                'test club of new club test',
                'identifier1',
                'DE',
                false,
            ).databaseObject,
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'personProperties\'. Expected type \'object\', but got undefined or null.',
        });
    });

    it('Create new club', async () => {

        // Create new club
        const personId = guid.newGuid();
        const signInDate = new Date();
        const callResult = await callFunction('newClub', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            changeType: 'upate',
            personProperties: new PersonPropertiesWithUserId(
                personId,
                signInDate,
                'userId',
                new PersonName('first name', 'last name')
            ).databaseObject,
            clubProperties: new ClubProperties(
                clubId,
                'test club of new club test',
                'identifier1',
                'DE',
                false,
            ).databaseObject,
        });
        expectFunctionSuccess(callResult).to.be.deep.equal(undefined);

        // Check club properties
        const crypter = new Crypter(cryptionKeys(new DatabaseType('testing')));
        const clubProperties = await getDatabaseValue(`${clubId.guidString}`);
        clubProperties['persons'][personId.guidString] =
            crypter.decryptDecode(clubProperties['persons'][personId.guidString]);
        expect(clubProperties).to.be.deep.equal({
            identifier: 'identifier1',
            inAppPaymentActive: false,
            name: 'test club of new club test',
            personUserIds: {
                userId: personId.guidString,
            },
            persons: {
                [personId.guidString]: {
                    name: {
                        first: 'first name',
                        last: 'last name',
                    },
                    signInData: {
                        admin: true,
                        signInDate: signInDate.toISOString(),
                        userId: 'userId',
                    },
                },
            },
            regionCode: 'DE',
        });
    });

    it('Existing identifier', async () => {

        // Create first club
        const personId = guid.newGuid();
        const signInDate = new Date();
        const callResult1 = await callFunction('newClub', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            changeType: 'upate',
            personProperties: new PersonPropertiesWithUserId(
                personId,
                signInDate,
                'userId',
                new PersonName('first name', 'last name')
            ).databaseObject,
            clubProperties: new ClubProperties(
                clubId,
                'test club of new club test',
                'identifier1',
                'DE',
                false,
            ).databaseObject,
        });
        expectFunctionSuccess(callResult1).to.be.deep.equal(undefined);

        // Check club properties
        const clubProperties = await getDatabaseOptionalValue(`${clubId.guidString}`);
        expect(clubProperties).to.be.not.null;

        // Try create club with same identifier
        const callResult2 = await callFunction('newClub', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            changeType: 'upate',
            personProperties: new PersonPropertiesWithUserId(
                personId,
                signInDate,
                'userId asdf',
                new PersonName('first asdfname', 'last nbsgfsame')
            ).databaseObject,
            clubProperties: new ClubProperties(
                guid.newGuid(),
                'test clubasdf of new club test',
                'identifier1',
                'DE',
                true,
            ).databaseObject,
        });
        expectFunctionFailed(callResult2).to.be.deep.equal({
            code: 'already-exists',
            message: 'Club identifier already exists',
        });
    });

    it('Same id', async () => {

        // Create first club
        const personId = guid.newGuid();
        const signInDate = new Date();
        const callResult1 = await callFunction('newClub', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            changeType: 'upate',
            personProperties: new PersonPropertiesWithUserId(
                personId,
                signInDate,
                'userId',
                new PersonName('first name', 'last name')
            ).databaseObject,
            clubProperties: new ClubProperties(
                clubId,
                'test club of new club test',
                'identifier1',
                'DE',
                false,
            ).databaseObject,
        });
        expectFunctionSuccess(callResult1).to.be.equal(undefined);

        // Check club properties
        const clubProperties1 = await getDatabaseOptionalValue(`${clubId.guidString}`);
        expect(clubProperties1).to.be.not.null;

        // Create club with same id
        const callResult2 = await callFunction('newClub', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            changeType: 'upate',
            personProperties: new PersonPropertiesWithUserId(
                personId,
                signInDate,
                'userId asdf',
                new PersonName('first asdfname', 'last nbsgfsame')
            ).databaseObject,
            clubProperties: new ClubProperties(
                clubId,
                'test clubasdf of new club test',
                'identifier2',
                'DE',
                true,
            ).databaseObject,
        });
        expectFunctionSuccess(callResult2).to.be.equal(undefined);

        // Check club properties
        const crypter = new Crypter(cryptionKeys(new DatabaseType('testing')));
        const clubProperties2 = await getDatabaseValue(`${clubId.guidString}`);
        clubProperties2['persons'][personId.guidString] =
            crypter.decryptDecode(clubProperties2['persons'][personId.guidString]);
        expect(clubProperties2).to.be.deep.equal({
            identifier: 'identifier1',
            inAppPaymentActive: false,
            name: 'test club of new club test',
            personUserIds: {
                userId: personId.guidString,
            },
            persons: {
                [personId.guidString]: {
                    name: {
                        first: 'first name',
                        last: 'last name',
                    },
                    signInData: {
                        admin: true,
                        signInDate: signInDate.toISOString(),
                        userId: 'userId',
                    },
                },
            },
            regionCode: 'DE',
        });
    });
});
