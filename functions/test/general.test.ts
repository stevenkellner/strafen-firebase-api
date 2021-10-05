import {FirebaseError} from "@firebase/app";
import {signOut} from "@firebase/auth";
import {expect, assert, AssertionError} from "chai";
import {privateKey} from "../src/privateKeys";
import {guid} from "../src/TypeDefinitions/guid";
import {callFunction, signInTestUser, auth} from "./utils";

describe("General", () => {
    beforeEach(async () => {
        if (auth.currentUser != null)
            await signOut(auth);
    });

    it("No parameters", async () => {
        try {
            await callFunction("changeFinePayed", null);
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse 'verbose'. No parameters specified to this function.");
        }
    });

    it("No private key", async () => {
        try {
            await callFunction("changeFinePayed", {});
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse 'privateKey'. Expected type 'string', but got undefined or null.");
        }
    });

    it("Invalid club level", async () => {
        try {
            await callFunction("changeFinePayed", {
                privateKey: "some key",
                clubLevel: "invalid level",
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                state: {
                    state: "unpayed",
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse ClubLevel, expected 'regular', 'debug' or 'testing', but got invalid level instead.");
        }
    });

    it("Invalid guid", async () => {
        try {
            await callFunction("changeFinePayed", {
                privateKey: "some key",
                clubLevel: "testing",
                clubId: "invalid guid",
                fineId: guid.newGuid().guidString,
                state: {
                    state: "unpayed",
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse Guid, guid string isn't a valid Guid: invalid guid");
        }
    });

    it("Invalid private key", async () => {
        try {
            await callFunction("changeFinePayed", {
                privateKey: "invalidKey",
                clubLevel: "testing",
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                state: {
                    state: "unpayed",
                    updateProperties: {
                        timestamp: 123456,
                        personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                    },
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.equal("functions/permission-denied");
            expect((error as FirebaseError).message).to.equal("Private key is invalid.");
        }
    });

    it("No user signed in", async () => {
        try {
            await callFunction("changeFinePayed", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                state: {
                    state: "unpayed",
                    updateProperties: {
                        timestamp: 123456,
                        personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                    },
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.equal("functions/permission-denied");
            expect((error as FirebaseError).message).to.equal("The function must be called while authenticated, nobody signed in.");
        }
    });

    it("User not in club", async () => {
        try {
            await signInTestUser();
            await callFunction("changeFinePayed", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                state: {
                    state: "unpayed",
                    updateProperties: {
                        timestamp: 123456,
                        personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                    },
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.equal("functions/permission-denied");
            expect((error as FirebaseError).message).to.equal("The function must be called while authenticated, person not in club.");
        }
    });

    it("Older function value", async () => {
        try {
            const clubId = guid.newGuid();
            const fineId = guid.fromString("1B5F958E-9D7D-46E1-8AEE-F52F4370A95A", undefined);
            await signInTestUser();
            await callFunction("newTestClub", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                testClubType: "default",
            });
            await callFunction("changeFinePayed", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                fineId: fineId.guidString,
                state: {
                    state: "unpayed",
                    updateProperties: {
                        timestamp: 12344,
                        personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                    },
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.equal("functions/cancelled");
            expect((error as FirebaseError).message).to.equal("Server value is newer or same old than updated value:\n\t- Server  : 12345\n\t- Function: 12344");
        }
        await callFunction("deleteTestClubs", {
            privateKey: privateKey,
            clubLevel: "testing",
        });
        await signOut(auth);
    });

    it("Same old function value", async () => {
        try {
            const clubId = guid.newGuid();
            const fineId = guid.fromString("1B5F958E-9D7D-46E1-8AEE-F52F4370A95A", undefined);
            await signInTestUser();
            await callFunction("newTestClub", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                testClubType: "default",
            });
            await callFunction("changeFinePayed", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                fineId: fineId.guidString,
                state: {
                    state: "unpayed",
                    updateProperties: {
                        timestamp: 12345,
                        personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                    },
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.equal("functions/cancelled");
            expect((error as FirebaseError).message).to.equal("Server value is newer or same old than updated value:\n\t- Server  : 12345\n\t- Function: 12345");
        }
        await callFunction("deleteTestClubs", {
            privateKey: privateKey,
            clubLevel: "testing",
        });
        await signOut(auth);
    });
});
