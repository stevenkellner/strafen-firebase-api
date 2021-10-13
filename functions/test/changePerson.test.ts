import {privateKey} from "../src/privateKeys";
import {guid} from "../src/TypeDefinitions/guid";
import {auth, callFunction, getDatabasePersons, getDatabaseStatisticsPropertiesWithName, signInTestUser} from "./utils";
import {signOut} from "firebase/auth";
import {assert, AssertionError, expect} from "chai";
import {FirebaseError} from "firebase-admin";
import {Person} from "../src/TypeDefinitions/Person";
import { LoggingProperties } from "../src/TypeDefinitions/LoggingProperties";
import { ParameterContainer } from "../src/TypeDefinitions/ParameterContainer";

describe("ChangePerson", () => {

    const loggingProperties = LoggingProperties.withFirst(new ParameterContainer({verbose: true}), "changePersonTest", undefined, "notice");

    const clubId = guid.fromString("c5429fcd-3b4b-437c-83a7-0e5433cc4cac", loggingProperties.nextIndent);

    beforeEach(async () => {
        await signInTestUser();
        await callFunction("newTestClub", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            testClubType: "default",
        });
    });

    afterEach(async () => {
        await callFunction("deleteTestClubs", {
            privateKey: privateKey,
            clubLevel: "testing",
        });
        await signOut(auth);
    });

    it("No club id", async () => {
        try {
            await callFunction("changePerson", {
                privateKey: privateKey,
                clubLevel: "testing",
                changeType: "upate",
                person: "some Person",
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse 'clubId'. Expected type 'string', but got undefined or null.");
        }
    });

    it("No change type", async () => {
        try {
            await callFunction("changePerson", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                person: "some Person",
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse 'changeType'. Expected type 'string', but got undefined or null.");
        }
    });

    it("Invalid change type", async () => {
        try {
            await callFunction("changePerson", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                changeType: "invalid",
                person: "some Person",
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse ChangeType, expected 'delete' or 'update', but got invalid instead.");
        }
    });

    it("No person", async () => {
        try {
            await callFunction("changePerson", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                changeType: "update",
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse 'person'. Expected type 'object', but got undefined or null.");
        }
    });

    it("Invalid person", async () => {
        try {
            await callFunction("changePerson", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                changeType: "update",
                person: "invalid",
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse 'person'. Expected type 'object', but got 'invalid' from type 'string'.");
        }
    });

    it("Already signed in", async () => {
        try {
            await callFunction("changePerson", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                changeType: "delete",
                person: {
                    id: "76025DDE-6893-46D2-BC34-9864BB5B8DAD",
                    name: {
                        first: "some",
                        last: "name",
                    },
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.equal("functions/unavailable");
            expect((error as FirebaseError).message).to.equal("Person is already signed in!");
        }
    });

    async function setPerson(variant: boolean): Promise<Person> {
        const person = new Person.Builder().fromValue(variant ? {
            id: "61756c29-ac8a-4471-a283-4dde2623a1b9",
            name: {
                first: "asdf",
                last: "jklö",
            },
        } : {
            id: "61756c29-ac8a-4471-a283-4dde2623a1b9",
            name: {
                first: "wgn",
                last: "jzhtre",
            },
        }, loggingProperties.nextIndent);

        // Set person
        await callFunction("changePerson", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            changeType: "update",
            person: person.serverObject,
        });

        // Check person
        const personList = await getDatabasePersons(clubId, loggingProperties.nextIndent);
        const fetchedPerson = personList.find(_person => _person.id.equals(person.id));
        expect(fetchedPerson).to.deep.equal(person);

        return person;
    }

    it("Person set", async () => {
        const person = await setPerson(false);

        // Check statistic
        const statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, "changePerson", loggingProperties.nextIndent);
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            changedPerson: person.serverObject,
        });
    });

    it("Person update", async () => {
        const person1 = await setPerson(false);
        const person2 = await setPerson(true);

        // Check statistic
        let statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, "changePerson", loggingProperties.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousPerson!= null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousPerson: person1.serverObject,
            changedPerson: person2.serverObject,
        });
    });

    it("Person delete", async () => {
        const person = await setPerson(true);

        await callFunction("changePerson", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            changeType: "delete",
            person: person.serverObject,
        });

        // Check person
        const personList = await getDatabasePersons(clubId, loggingProperties.nextIndent);
        const fetchedPerson = personList.find(_person => _person.id.equals(person.id));
        expect(fetchedPerson).to.be.equal(undefined);

        // Check statistic
        let statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, "changePerson", loggingProperties.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousPerson != null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousPerson: person.serverObject,
        });
    });
});
