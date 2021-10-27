import { assert, expect } from "chai";
import { signOut } from "firebase/auth";
import { privateKey } from "../src/privateKeys";
import { guid } from "../src/TypeDefinitions/guid";
import { LoggingProperties } from "../src/TypeDefinitions/LoggingProperties";
import { ParameterContainer } from "../src/TypeDefinitions/ParameterContainer";
import { PersonName } from "../src/TypeDefinitions/PersonName";
import { PersonPropertiesWithUserId } from "../src/TypeDefinitions/PersonPropertiesWithUserId";
import { auth, callFunction, firebaseError, getDatabaseValue, signInTestUser } from "./utils";

describe("RegisterPerson", () => {

    const loggingProperties = LoggingProperties.withFirst(new ParameterContainer({verbose: true}), "registerPersonTest", undefined, "notice");

    const clubId = guid.fromString("aab0bbc6-c1b4-4e6f-8919-77f01aa10749", loggingProperties.nextIndent);

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
            const personId = guid.newGuid();
            await callFunction("registerPerson", {
                privateKey: privateKey,
                clubLevel: "testing",
                personProperties: new PersonPropertiesWithUserId(
                    personId,
                    new Date(),
                    "userId-123",
                    new PersonName("first name", "last name")
                ).serverObject,
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: "functions/invalid-argument",
                message: "Couldn't parse 'clubId'. Expected type 'string', but got undefined or null.",
            });
        }
    });

    it("No person properties", async () => {
        try {
            await callFunction("registerPerson", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: "functions/invalid-argument",
                message: "Couldn't parse 'personProperties'. Expected type 'object', but got undefined or null.",
            });
        }
    });

    it("Register new person", async () => {

        // Register person
        const personId = guid.newGuid();
        const signInDate = new Date();
        const returnValue = await callFunction("registerPerson", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            personProperties: new PersonPropertiesWithUserId(
                personId,
                signInDate,
                "userId-123",
                new PersonName("first name", "last name")
            ).serverObject,
        });

        // Check return value
        expect(returnValue.data).to.be.deep.equal({
            id: clubId.guidString,
            identifier: "demo-team",
            inAppPaymentActive: true,
            name: "Neuer Verein",
            regionCode: "DE",
        });

        // Check database person user ids
        const fetchedPersonId = await getDatabaseValue(`testableClubs/${clubId.guidString}/personUserIds/userId-123`);
        expect(fetchedPersonId).to.be.equal(personId.guidString);

        // Check database person
        const fetchedPerson = await getDatabaseValue(`testableClubs/${clubId.guidString}/persons/${personId.guidString}`);
        expect(fetchedPerson).to.be.deep.equal({
            name: {
                first: "first name",
                last: "last name",
            },
            signInData: {
                admin: false,
                signInDate: signInDate.toISOString(),
                userId: "userId-123",
            },
        });
    });
});
