import { unhashedFunctionCallKey } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import {
    auth,
    callFunction,
    expectFunctionFailed, expectFunctionSuccess,
    getDatabasePersons,
    getDatabaseStatisticsPropertyWithIdentifier,
    signInTestUser,
} from './utils';
import { signOut } from 'firebase/auth';
import { expect } from 'chai';
import { Person } from '../src/TypeDefinitions/Person';
import { Logger } from '../src/Logger';
import { Updatable, UpdateProperties } from '../src/TypeDefinitions/Updatable';
import { DatabaseType } from '../src/TypeDefinitions/DatabaseType';

describe('ChangePerson', () => {

    const logger = Logger.start(true, 'changePersonTest', undefined, 'notice');

    const clubId = guid.fromString('c5429fcd-3b4b-437c-83a7-0e5433cc4cac', logger.nextIndent);

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
        const callResult = await callFunction('changePerson', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            changeType: 'upate',
            person: 'some Person',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'clubId\'. Expected type \'string\', but got undefined or null.',
        });
    });

    it('No change type', async () => {
        const callResult = await callFunction('changePerson', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            person: 'some Person',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'changeType\'. Expected type \'string\', but got undefined or null.',
        });
    });

    it('Invalid change type', async () => {
        const callResult = await callFunction('changePerson', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'invalid',
            person: 'some Person',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse ChangeType, expected \'delete\' or \'update\', but got invalid instead.',
        });
    });

    it('No person', async () => {
        const callResult = await callFunction('changePerson', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'update',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'updatablePerson\'. Expected type \'object\', but got undefined or null.',
        });
    });

    it('Invalid person', async () => {
        const callResult = await callFunction('changePerson', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'update',
            updatablePerson: 'invalid',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            // eslint-disable-next-line max-len
            message: 'Couldn\'t parse \'updatablePerson\'. Expected type \'object\', but got \'invalid\' from type \'string\' instead.',
        });
    });

    it('Already signed in', async () => {
        const callResult = await callFunction('changePerson', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'delete',
            updatablePerson: {
                id: '76025DDE-6893-46D2-BC34-9864BB5B8DAD',
                deleted: true,
                updateProperties: {
                    timestamp: '2011-10-15T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'unavailable',
            message: 'Person is already signed in!',
        });
    });

    // eslint-disable-next-line require-jsdoc
    async function setPerson(variant: boolean, timestamp: Date): Promise<Person> {
        const person = Person.fromObject(variant ? {
            id: '61756c29-ac8a-4471-a283-4dde2623a1b9',
            name: {
                first: 'asdf',
                last: 'jklö',
            },
        } : {
            id: '61756c29-ac8a-4471-a283-4dde2623a1b9',
            name: {
                first: 'wgn',
                last: 'jzhtre',
            },
        }, logger.nextIndent) as Person;
        expect(person).to.be.instanceOf(Person);

        // Set person
        const updatablePerson = new Updatable<Person>(
            person,
            new UpdateProperties(timestamp, guid.fromString('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7', logger.nextIndent))
        );
        const callResult = await callFunction('changePerson', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'update',
            updatablePerson: updatablePerson.databaseObject,
        });
        expectFunctionSuccess(callResult).to.be.equal(undefined);

        // Check person
        const personList = await getDatabasePersons(clubId, logger.nextIndent);
        const fetchedPerson = personList.find(_person => _person.property.id.equals(person.id));
        expect(fetchedPerson?.property).to.deep.equal(person);

        return person;
    }

    it('Person set', async () => {
        const person = await setPerson(false, new Date('2011-10-14T10:42:38+0000'));

        // Check statistic
        const statisticsList =
            await getDatabaseStatisticsPropertyWithIdentifier(clubId, 'changePerson', logger.nextIndent);
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousPerson: null,
            changedPerson: person.databaseObject,
        });
    });

    it('Person update', async () => {
        const person1 = await setPerson(false, new Date('2011-10-14T10:42:38+0000'));
        const person2 = await setPerson(true, new Date('2011-10-15T10:42:38+0000'));

        // Check statistic
        let statisticsList =
            await getDatabaseStatisticsPropertyWithIdentifier(clubId, 'changePerson', logger.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousPerson!= null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousPerson: person1.databaseObject,
            changedPerson: person2.databaseObject,
        });
    });

    it('Person delete', async () => {
        const person = await setPerson(true, new Date('2011-10-14T10:42:38+0000'));

        const callResult = await callFunction('changePerson', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'delete',
            updatablePerson: {
                id: person.id.guidString,
                deleted: true,
                updateProperties: {
                    timestamp: '2011-10-15T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });
        expectFunctionSuccess(callResult).to.be.equal(undefined);

        // Check person
        const personList = await getDatabasePersons(clubId, logger.nextIndent);
        const fetchedPerson = personList.find(_person => _person.property.id.equals(person.id))?.property;
        expect(fetchedPerson?.databaseObject).to.be.deep.equal({
            deleted: true,
        });

        // Check statistic
        let statisticsList =
            await getDatabaseStatisticsPropertyWithIdentifier(clubId, 'changePerson', logger.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousPerson != null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousPerson: person.databaseObject,
            changedPerson: null,
        });
    });
});
