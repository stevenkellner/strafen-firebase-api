import { assert, expect } from "chai";
import { signOut } from "firebase/auth";
import { privateKey } from "../src/privateKeys";
import { guid } from "../src/TypeDefinitions/guid";
import { LoggingProperties } from "../src/TypeDefinitions/LoggingProperties";
import { ParameterContainer } from "../src/TypeDefinitions/ParameterContainer";
import { auth, callFunction, firebaseError, signInTestUser } from "./utils";

describe("GetPersonProperties", () => {

    const loggingProperties = LoggingProperties.withFirst(new ParameterContainer({verbose: true}), "getPersonPropertiesTest", undefined, "notice");

    const clubId = guid.fromString("7760bbc6-c1b4-4e6f-8919-77f01aa10749", loggingProperties.nextIndent);

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

    it("No user id", async () => {
        try {
            await callFunction("getPersonProperties", {
                privateKey: privateKey,
                clubLevel: "testing",
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: "functions/invalid-argument",
                message: "Couldn't parse 'userId'. Expected type 'string', but got undefined or null.",
            });
        }
    });

    it("With existsting identifier", async () => {
        const httpResult = await callFunction("getPersonProperties", {
            privateKey: privateKey,
            clubLevel: "testing",
            userId: "LpAaeCz0BQfDHVYw02KiCyoTMS13",
        });
        expect(httpResult.data).to.be.deep.equal({
            clubProperties: {
                id: clubId.guidString,
                identifier: "demo-team",
                inAppPaymentActive: true,
                name: "Neuer Verein",
                regionCode: "DE",
            },
            personProperties: {
                id: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                isCashier: true,
                name: {
                    first: "Max",
                    last: "Mustermann",
                },
                signInDate: "2011-09-13T10:42:38+0000",
            },
        });
    });

    it("With not existsting identifier", async () => {
        try {
            await callFunction("getPersonProperties", {
                privateKey: privateKey,
                clubLevel: "testing",
                userId: "invalid",
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: "functions/not-found",
                message: "Person doesn't exist.",
            });
        }
    });
});
