import {privateKey} from "../src/privateKeys";
import {guid} from "../src/TypeDefinitions/guid";
import {auth, callFunction, firebaseError, getDatabaseOptionalValue, getDatabaseValue, signInTestUser} from "./utils";
import {signOut} from "firebase/auth";
import {assert, expect} from "chai";
import { LoggingProperties } from "../src/TypeDefinitions/LoggingProperties";
import { ParameterContainer } from "../src/TypeDefinitions/ParameterContainer";
import { PersonPropertiesWithUserId } from "../src/TypeDefinitions/PersonPropertiesWithUserId";
import { PersonName } from "../src/TypeDefinitions/PersonName";
import { ClubProperties } from "../src/TypeDefinitions/ClubProperties";

describe("NewClub", () => {

    const loggingProperties = LoggingProperties.withFirst(new ParameterContainer({verbose: true}), "newClubTest", undefined, "notice");

    const clubId = guid.fromString("dd129fcd-3b4b-437c-83a7-0e5433cc4cac", loggingProperties.nextIndent);

    beforeEach(async () => {
        await signInTestUser();
    });

    afterEach(async () => {
        await callFunction("deleteTestClubs", {
            privateKey: privateKey,
            clubLevel: "testing",
        });
        await signOut(auth);
    });

    it("No club properties", async () => {
        try {
            const personId = guid.newGuid();
            await callFunction("newClub", {
                privateKey: privateKey,
                clubLevel: "testing",
                changeType: "upate",
                personProperties: new PersonPropertiesWithUserId(
                    personId,
                    new Date(),
                    "userId",
                    new PersonName("first name", "last name")
                ).serverObject,
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: "functions/invalid-argument",
                message: "Couldn't parse 'clubProperties'. Expected type 'object', but got undefined or null.",
            });
        }
    });

    it("No person properties", async () => {
        try {
            await callFunction("newClub", {
                privateKey: privateKey,
                clubLevel: "testing",
                changeType: "upate",
                clubProperties: new ClubProperties(
                    clubId,
                    "test club of new club test",
                    "identifier1",
                    "DE",
                    false,
                ).serverObject,
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: "functions/invalid-argument",
                message: "Couldn't parse 'personProperties'. Expected type 'object', but got undefined or null.",
            });
        }
    });

    it("Create new club", async () => {

        // Create new club
        const personId = guid.newGuid();
        const signInDate = new Date();
        await callFunction("newClub", {
            privateKey: privateKey,
            clubLevel: "testing",
            changeType: "upate",
            personProperties: new PersonPropertiesWithUserId(
                personId,
                signInDate,
                "userId",
                new PersonName("first name", "last name")
            ).serverObject,
            clubProperties: new ClubProperties(
                clubId,
                "test club of new club test",
                "identifier1",
                "DE",
                false,
            ).serverObject,
        });

        // Check club properties
        const clubProperties = await getDatabaseValue(`testableClubs/${clubId.guidString}`);
        expect(clubProperties).to.be.deep.equal({
            identifier: "identifier1",
            inAppPaymentActive: false,
            name: "test club of new club test",
            personUserIds: {
                userId: personId.guidString,
            },
            persons: {
                [personId.guidString]: {
                    name: {
                        first: "first name",
                        last: "last name",
                    },
                    signInData: {
                        cashier: true,
                        signInDate: signInDate.toISOString(),
                        userId: "userId",
                    },
                },
            },
            regionCode: "DE",
        });
    });

    it("Existing identifier", async () => {

        // Create first club
        const personId = guid.newGuid();
        const signInDate = new Date();
        await callFunction("newClub", {
            privateKey: privateKey,
            clubLevel: "testing",
            changeType: "upate",
            personProperties: new PersonPropertiesWithUserId(
                personId,
                signInDate,
                "userId",
                new PersonName("first name", "last name")
            ).serverObject,
            clubProperties: new ClubProperties(
                clubId,
                "test club of new club test",
                "identifier1",
                "DE",
                false,
            ).serverObject,
        });

        // Check club properties
        const clubProperties = await getDatabaseOptionalValue(`testableClubs/${clubId.guidString}`);
        expect(clubProperties).to.be.not.null;

        // Try create club with same identifier
        try {
            await callFunction("newClub", {
                privateKey: privateKey,
                clubLevel: "testing",
                changeType: "upate",
                personProperties: new PersonPropertiesWithUserId(
                    personId,
                    signInDate,
                    "userId asdf",
                    new PersonName("first asdfname", "last nbsgfsame")
                ).serverObject,
                clubProperties: new ClubProperties(
                    guid.newGuid(),
                    "test clubasdf of new club test",
                    "identifier1",
                    "DE",
                    true,
                ).serverObject,
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: "functions/already-exists",
                message: "Club identifier already exists",
            });
        }
    });

    it("Same id", async () => {

        // Create first club
        const personId = guid.newGuid();
        const signInDate = new Date();
        await callFunction("newClub", {
            privateKey: privateKey,
            clubLevel: "testing",
            changeType: "upate",
            personProperties: new PersonPropertiesWithUserId(
                personId,
                signInDate,
                "userId",
                new PersonName("first name", "last name")
            ).serverObject,
            clubProperties: new ClubProperties(
                clubId,
                "test club of new club test",
                "identifier1",
                "DE",
                false,
            ).serverObject,
        });

        // Check club properties
        const clubProperties1 = await getDatabaseOptionalValue(`testableClubs/${clubId.guidString}`);
        expect(clubProperties1).to.be.not.null;

        // Create club with same id
        await callFunction("newClub", {
            privateKey: privateKey,
            clubLevel: "testing",
            changeType: "upate",
            personProperties: new PersonPropertiesWithUserId(
                personId,
                signInDate,
                "userId asdf",
                new PersonName("first asdfname", "last nbsgfsame")
            ).serverObject,
            clubProperties: new ClubProperties(
                clubId,
                "test clubasdf of new club test",
                "identifier2",
                "DE",
                true,
            ).serverObject,
        });

        // Check club properties
        const clubProperties2 = await getDatabaseValue(`testableClubs/${clubId.guidString}`);
        expect(clubProperties2).to.be.deep.equal({
            identifier: "identifier1",
            inAppPaymentActive: false,
            name: "test club of new club test",
            personUserIds: {
                userId: personId.guidString,
            },
            persons: {
                [personId.guidString]: {
                    name: {
                        first: "first name",
                        last: "last name",
                    },
                    signInData: {
                        cashier: true,
                        signInDate: signInDate.toISOString(),
                        userId: "userId",
                    },
                },
            },
            regionCode: "DE",
        });
    });
});
