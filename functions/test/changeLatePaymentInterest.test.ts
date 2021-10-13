import {privateKey} from "../src/privateKeys";
import {guid} from "../src/TypeDefinitions/guid";
import {auth, callFunction, signInTestUser} from "./utils";
import {signOut} from "firebase/auth";
import {assert, AssertionError, expect} from "chai";
import {FirebaseError} from "firebase-admin";
import { LoggingProperties } from "../src/TypeDefinitions/LoggingProperties";
import { ParameterContainer } from "../src/TypeDefinitions/ParameterContainer";

describe("ChangeLatePaymentInterest", () => {

    const loggingProperties = LoggingProperties.withFirst(new ParameterContainer({verbose: true}), "changeLatePaymentInterestTest", undefined, "notice");

    const clubId = guid.fromString("36cf0982-d1de-4316-ba67-a38ce64712fd", loggingProperties.nextIndent);

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
            await callFunction("changeLatePaymentInterest", {
                privateKey: privateKey,
                clubLevel: "testing",
                changeType: "upate",
                interest: "some Interest",
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
            await callFunction("changeLatePaymentInterest", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                interest: "some Interest",
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
            await callFunction("changeLatePaymentInterest", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                changeType: "invalid",
                interest: "some Interest",
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

    it("No interest", async () => {
        try {
            await callFunction("changeLatePaymentInterest", {
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
            expect((error as FirebaseError).message).to.equal("Couldn't parse 'interest'. Expected type 'object', but got undefined or null.");
        }
    });

    it("Invalid interest", async () => {
        try {
            await callFunction("changeLatePaymentInterest", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                changeType: "update",
                interest: "invalid",
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse 'interest'. Expected type 'object', but got 'invalid' from type 'string'.");
        }
    });

    /* async function setInterest(variant: boolean): Promise<LatePaymentInterest> {
        const interest = LatePaymentInterest.fromObject(variant ? {

        } : {

        });

        // Set interest
        await callFunction("changeLatePaymentInterest", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            changeType: "update",
            interest: interest,
        });

        // TOOD: Check interest

        return interest;
    }*/
});
