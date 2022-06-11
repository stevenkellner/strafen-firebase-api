import { privateKey } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import {
    auth,
    callFunction,
    firebaseError,
    getDatabasePersons,
    getDatabaseStatisticsPropertyWithIdentifier,
    signInTestUser,
} from './utils';
import { signOut } from 'firebase/auth';
import { assert, expect } from 'chai';
import { Person } from '../src/TypeDefinitions/Person';
import { Logger } from '../src/Logger';
import { ParameterContainer } from '../src/ParameterContainer';
import { Updatable, UpdateProperties } from '../src/TypeDefinitions/UpdateProperties';

describe('ChangePerson', () => {

    const logger = Logger.start(new ParameterContainer({ verbose: true }), 'changePersonTest', undefined, 'notice');

    const clubId = guid.fromString('c5429fcd-3b4b-437c-83a7-0e5433cc4cac', logger.nextIndent);

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

    it('No club id', async () => {
        try {
            await callFunction('changePerson', {
                privateKey: privateKey,
                databaseType: 'testing',
                changeType: 'upate',
                person: 'some Person',
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse \'clubId\'. Expected type \'string\', but got undefined or null.',
            });
        }
    });

    it('No change type', async () => {
        try {
            await callFunction('changePerson', {
                privateKey: privateKey,
                databaseType: 'testing',
                clubId: clubId.guidString,
                person: 'some Person',
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse \'changeType\'. Expected type \'string\', but got undefined or null.',
            });
        }
    });

    it('Invalid change type', async () => {
        try {
            await callFunction('changePerson', {
                privateKey: privateKey,
                databaseType: 'testing',
                clubId: clubId.guidString,
                changeType: 'invalid',
                person: 'some Person',
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse ChangeType, expected \'delete\' or \'update\', but got invalid instead.',
            });
        }
    });

    it('No person', async () => {
        try {
            await callFunction('changePerson', {
                privateKey: privateKey,
                databaseType: 'testing',
                clubId: clubId.guidString,
                changeType: 'update',
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse \'person\'. Expected type \'object\', but got undefined or null.',
            });
        }
    });

    it('Invalid person', async () => {
        try {
            await callFunction('changePerson', {
                privateKey: privateKey,
                databaseType: 'testing',
                clubId: clubId.guidString,
                changeType: 'update',
                person: 'invalid',
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                // eslint-disable-next-line max-len
                message: 'Couldn\'t parse \'person\'. Expected type \'object\', but got \'invalid\' from type \'string\' instead.',
            });
        }
    });

    it('Already signed in', async () => {
        try {
            await callFunction('changePerson', {
                privateKey: privateKey,
                databaseType: 'testing',
                clubId: clubId.guidString,
                changeType: 'delete',
                person: {
                    id: '76025DDE-6893-46D2-BC34-9864BB5B8DAD',
                    deleted: true,
                    updateProperties: {
                        timestamp: '2011-10-15T10:42:38+0000',
                        personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                    },
                },
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/unavailable',
                message: 'Person is already signed in!',
            });
        }
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
        await callFunction('changePerson', {
            privateKey: privateKey,
            databaseType: 'testing',
            clubId: clubId.guidString,
            changeType: 'update',
            person: updatablePerson.databaseObject,
        });

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

        await callFunction('changePerson', {
            privateKey: privateKey,
            databaseType: 'testing',
            clubId: clubId.guidString,
            changeType: 'delete',
            person: {
                id: person.id.guidString,
                deleted: true,
                updateProperties: {
                    timestamp: '2011-10-15T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });

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
        });
    });
});
