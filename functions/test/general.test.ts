import {FirebaseError} from "@firebase/app";
import {signOut} from "@firebase/auth";
import {expect, assert} from "chai";
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
            expect(false, "A statement above should throw an exception.").to.be.true;
        } catch (error) {
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse 'privateKey'. No parameters specified to this function.");
        }
    });

    it("No private key", async () => {
        try {
            await callFunction("changeFinePayed", {});
            expect(false, "A statement above should throw an exception.").to.be.true;
        } catch (error) {
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
            expect(false, "A statement above should throw an exception.").to.be.true;
        } catch (error) {
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
            expect(false, "A statement above should throw an exception.").to.be.true;
        } catch (error) {
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
                },
            });
            expect(false, "A statement above should throw an exception.").to.be.true;
        } catch (error) {
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
                },
            });
            expect(false, "A statement above should throw an exception.").to.be.true;
        } catch (error) {
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
                },
            });
            expect(false, "A statement above should throw an exception.").to.be.true;
        } catch (error) {
            expect((error as FirebaseError).code).to.equal("functions/permission-denied");
            expect((error as FirebaseError).message).to.equal("The function must be called while authenticated, person not in club.");
        }
    });
});
