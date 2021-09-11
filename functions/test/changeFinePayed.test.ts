import {privateKey} from "../src/privateKeys";
import {guid} from "../src/TypeDefinitions/guid";
import {auth, callFunction, getDatabaseFines, getDatabaseReasonTemplates, signInTestUser} from "./utils";
import {assert, expect} from "chai";
import {signOut} from "firebase/auth";
import {Fine} from "../src/TypeDefinitions/Fine";
import {FineReasonTemplate} from "../src/TypeDefinitions/FineReason";
import {ReasonTemplate} from "../src/TypeDefinitions/ReasonTemplate";
import { FirebaseError } from "firebase/app";

describe("ChangeFinePayed", () => {

    const clubId = guid.fromString("1992af26-8b42-4452-a564-7e376b6401db");

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
            await callFunction("changeFinePayed", {
                privateKey: privateKey,
                clubLevel: "testing",
                fineId: guid.newGuid().guidString,
                state: {
                    state: "unpayed",
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse 'clubId'. Expected type 'string', but got undefined or null.");
        }
    });

    it("No fine id", async () => {
        try {
            await callFunction("changeFinePayed", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: guid.newGuid().guidString,
                state: {
                    state: "unpayed",
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse 'fineId'. Expected type 'string', but got undefined or null.");
        }
    });

    it("No state", async () => {
        try {
            await callFunction("changeFinePayed", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse 'state'. Expected type 'object', but got undefined or null.");
        }
    });

    it("Invalid state.state", async () => {
        try {
            await callFunction("changeFinePayed", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                state: {
                    state: "invalid state",
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse PayedState parameter 'state'. Expected values 'payed', 'settled' or 'unpayed' from type 'string', but got 'invalid state' from type 'string'.");
        }
    });

    it("Invalid state payed no payDate", async () => {
        try {
            await callFunction("changeFinePayed", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                state: {
                    state: "payed",
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse PayedState since state is 'payed' but payDate or inApp is null.");
        }
    });

    it("Invalid state payed no inApp", async () => {
        try {
            await callFunction("changeFinePayed", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                state: {
                    state: "payed",
                    payDate: 123456789,
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse PayedState since state is 'payed' but payDate or inApp is null.");
        }
    });

    it("Not existing fine", async () => {
        try {
            await callFunction("changeFinePayed", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                fineId: guid.newGuid().guidString,
                state: {
                    state: "unpayed",
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            expect((error as FirebaseError).code).to.equal("functions/failed-precondition");
            expect((error as FirebaseError).message).to.equal("No fine payed state to change.");
        }
    });

    async function addFinesAndReason() {

        // Add reason
        const fine1 = Fine.fromObject({
            id: guid.fromString("637d6187-68d2-4000-9cb8-7dfc3877d5ba").guidString,
            personId: guid.fromString("5bf1ffda-4f69-41eb-ae93-0242ac130002").guidString,
            date: 9284765,
            payedState: {
                state: "unpayed",
            },
            number: 2,
            fineReason: {
                reasonTemplateId: guid.fromString("9d0681f0-2045-4a1d-abbc-6bb289934ff9").guidString,
            },
        });
        const reason = ReasonTemplate.fromObject({
            id: (fine1.fineReason.value as FineReasonTemplate).reasonTemplateId.guidString,
            reason: "asldkfj",
            importance: "low",
            amount: 12.98,
        });
        await callFunction("changeReasonTemplate", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            changeType: "update",
            reasonTemplate: reason.object,
        });

        // Add fine with reason template
        await callFunction("changeFine", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            changeType: "update",
            fine: fine1.object,
        });

        // Add fine with custom reason
        const fine2 = Fine.fromObject({
            id: guid.fromString("137d6187-68d2-4000-9cb8-7dfc3877d5ba").guidString,
            personId: guid.fromString("5bf1ffda-4f69-41eb-ae93-0242ac130002").guidString,
            date: 9284765,
            payedState: {
                state: "payed",
                inApp: false,
                payDate: 234689,
            },
            number: 10,
            fineReason: {
                reason: "Reason",
                amount: 1.50,
                importance: "high",
            },
        });
        await callFunction("changeFine", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            changeType: "update",
            fine: fine2.object,
        });

        // Check fines and reason
        const fineList = await getDatabaseFines(clubId);
        const fetchedFine1 = fineList.find(fine => fine.id.equals(fine1.id));
        const fetchedFine2 = fineList.find(fine => fine.id.equals(fine2.id));
        expect(fetchedFine1).to.deep.equal(fine1);
        expect(fetchedFine2).to.deep.equal(fine2);

        const reasonList = await getDatabaseReasonTemplates(clubId);
        const fetchedReason = reasonList.find(_reason => _reason.id.equals(reason.id));
        expect(fetchedReason).to.deep.equal(reason);
    }

    it("asdf", async () => {
        await addFinesAndReason();
    });
});
