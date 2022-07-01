import { unhashedFunctionCallKey, cryptionKeys } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import {
    auth,
    callFunction,
    getDatabaseOptionalValue,
    getDatabaseStatisticsPropertyWithIdentifier,
    getDatabaseValue,
    signInTestUser, expectFunctionSuccess, expectFunctionFailed,
} from './utils';
import { signOut } from 'firebase/auth';
import { expect } from 'chai';
import { Logger } from '../src/Logger';
import { LatePaymentInterest } from '../src/TypeDefinitions/LatePaymentInterest';
import { Updatable, UpdateProperties } from '../src/TypeDefinitions/Updatable';
import { DatabaseType } from '../src/TypeDefinitions/DatabaseType';
import { Crypter } from '../src/crypter/Crypter';

describe('ChangeLatePaymentInterest', () => {

    const logger =
        Logger.start(true, 'changeLatePaymentInterestTest', {}, 'notice');

    const clubId = guid.fromString('36cf0982-d1de-4316-ba67-a38ce64712fd', logger.nextIndent);

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
        const callResult = await callFunction('changeLatePaymentInterest', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            changeType: 'upate',
            interest: 'some Interest',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'clubId\'. Expected type \'string\', but got undefined or null.',
        });
    });

    it('No change type', async () => {
        const callResult = await callFunction('changeLatePaymentInterest', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            interest: 'some Interest',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'changeType\'. Expected type \'string\', but got undefined or null.',
        });
    });

    it('Invalid change type', async () => {
        const callResult = await callFunction('changeLatePaymentInterest', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'invalid',
            interest: 'some Interest',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse ChangeType, expected \'delete\' or \'update\', but got invalid instead.',
        });
    });

    it('No interest', async () => {
        const callResult = await callFunction('changeLatePaymentInterest', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'update',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            // eslint-disable-next-line max-len
            message: 'Couldn\'t parse \'updatableInterest\'. Expected type \'object\', but got undefined or null.',
        });
    });

    it('Invalid interest', async () => {
        const callResult = await callFunction('changeLatePaymentInterest', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'update',
            updatableInterest: 'invalid',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            // eslint-disable-next-line max-len
            message: 'Couldn\'t parse \'updatableInterest\'. Expected type \'object\', but got \'invalid\' from type \'string\' instead.',
        });
    });

    // eslint-disable-next-line require-jsdoc
    async function setInterest(variant: boolean, timestamp: Date): Promise<LatePaymentInterest> {
        const interest = LatePaymentInterest.fromObject(variant ? {
            interestFreePeriod: {
                value: 1,
                unit: 'month',
            },
            interestPeriod: {
                value: 5,
                unit: 'day',
            },
            interestRate: 0.12,
            compoundInterest: false,
        } : {

            interestFreePeriod: {
                value: 2,
                unit: 'year',
            },
            interestPeriod: {
                value: 10,
                unit: 'month',
            },
            interestRate: 0.05,
            compoundInterest: true,
        }, logger.nextIndent) as LatePaymentInterest;
        expect(interest).to.be.instanceOf(LatePaymentInterest);

        // Set interest
        const updatableInterest = new Updatable<LatePaymentInterest>(
            interest,
            new UpdateProperties(timestamp, guid.fromString('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7', logger.nextIndent))
        );
        const callResult = await callFunction('changeLatePaymentInterest', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'update',
            updatableInterest: updatableInterest.databaseObject,
        });
        expectFunctionSuccess(callResult).to.be.equal(undefined);

        // Check interest
        const crypter = new Crypter(cryptionKeys(new DatabaseType('testing')));
        const fetchedInterest = Updatable.fromRawProperty(
            crypter.decryptDecode(await getDatabaseValue(`${clubId.guidString}/latePaymentInterest`)),
            LatePaymentInterest.fromValue,
            logger.nextIndent,
        );
        expect(fetchedInterest.property).to.deep.equal(interest);

        return interest;
    }

    it('Interest set', async () => {
        const interest = await setInterest(false, new Date('2011-10-14T10:42:38+0000'));

        // Check statistic
        const statisticsList =
            await getDatabaseStatisticsPropertyWithIdentifier(clubId, 'changeLatePaymentInterest', logger.nextIndent);
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            changedInterest: interest.databaseObject,
            previousInterest: null,
        });
    });

    it('Interest update', async () => {
        const interest1 = await setInterest(false, new Date('2011-10-14T10:42:38+0000'));
        const interest2 = await setInterest(false, new Date('2011-10-15T10:42:38+0000'));

        // Check statistic
        let statisticsList =
            await getDatabaseStatisticsPropertyWithIdentifier(clubId, 'changeLatePaymentInterest', logger.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousInterest!= null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            changedInterest: interest1.databaseObject,
            previousInterest: interest2.databaseObject,
        });
    });

    it('Interest delete', async () => {
        const interest = await setInterest(false, new Date('2011-10-14T10:42:38+0000'));

        const callResult = await callFunction('changeLatePaymentInterest', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'delete',
            updatableInterest: {
                deleted: true,
                updateProperties: {
                    timestamp: '2011-10-15T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });
        expectFunctionSuccess(callResult).to.be.equal(undefined);

        // Check interest
        const crypter = new Crypter(cryptionKeys(new DatabaseType('testing')));
        const fetchedInterest = Updatable.fromRawProperty(
            crypter.decryptDecode(await getDatabaseValue(`${clubId.guidString}/latePaymentInterest`)),
            LatePaymentInterest.fromValue,
            logger.nextIndent,
        );
        expect(fetchedInterest?.property.databaseObject).to.deep.equal({
            deleted: true,
        });

        // Check statistic
        let statisticsList =
            await getDatabaseStatisticsPropertyWithIdentifier(clubId, 'changeLatePaymentInterest', logger.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousInterest!= null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            changedInterest: null,
            previousInterest: interest.databaseObject,
        });
    });

    it('delete before adding interest', async () => {
        const callResult = await callFunction('changeLatePaymentInterest', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'delete',
            updatableInterest: {
                deleted: true,
                updateProperties: {
                    timestamp: '2011-10-15T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });
        expectFunctionSuccess(callResult).to.be.equal(undefined);

        // Check interest
        const crypter = new Crypter(cryptionKeys(new DatabaseType('testing')));
        const interest = await getDatabaseOptionalValue(`${clubId.guidString}/latePaymentInterest`);
        expect(crypter.decryptDecode(interest)).to.be.deep.equal({});
    });
});
