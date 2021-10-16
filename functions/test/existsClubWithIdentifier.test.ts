import { assert, expect } from "chai";
import { signOut } from "firebase/auth";
import { privateKey } from "../src/privateKeys";
import { guid } from "../src/TypeDefinitions/guid";
import { LoggingProperties } from "../src/TypeDefinitions/LoggingProperties";
import { ParameterContainer } from "../src/TypeDefinitions/ParameterContainer";
import { auth, callFunction, firebaseError, signInTestUser } from "./utils";

describe("ExistsClubWithIdentifier", () => {

    const loggingProperties = LoggingProperties.withFirst(new ParameterContainer({verbose: true}), "existsClubWithIdentifierTest", undefined, "notice");

    const clubId = guid.fromString("1a20bbc6-c1b4-4e6f-8919-77f01aa10749", loggingProperties.nextIndent);

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

    it("No identifier", async () => {
        try {
            await callFunction("existsClubWithIdentifier", {
                privateKey: privateKey,
                clubLevel: "testing",
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: "functions/invalid-argument",
                message: "Couldn't parse 'identifier'. Expected type 'string', but got undefined or null.",
            });
        }
    });

    it("With existsing identifier", async () => {
        const httpResult = await callFunction("existsClubWithIdentifier", {
            privateKey: privateKey,
            clubLevel: "testing",
            identifier: clubId.guidString,
        });
        expect(httpResult.data).to.be.true;
    });

    it("With not existsing identifier", async () => {
        const httpResult = await callFunction("existsClubWithIdentifier", {
            privateKey: privateKey,
            clubLevel: "testing",
            identifier: guid.newGuid().guidString,
        });
        expect(httpResult.data).to.be.false;
    });
});
