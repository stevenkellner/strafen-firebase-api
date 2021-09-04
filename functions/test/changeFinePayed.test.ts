import {assert, expect} from "chai";
import {FirebaseError} from "firebase/app";
import {signOut} from "firebase/auth";
import {privateKey} from "../src/privateKeys";
import {guid} from "../src/TypeDefinitions/guid";
import {auth, callFunction, signInTestUser} from "./utils";

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

    /* async function addFinesAndReason() {

    }*/
});

/*
/// Add fines and reason for test change fine payed
func _testChangeFinePayedAddFinesAndReason() async throws {

    // Add reason
    let clubId = TestProperty.shared.testClub.id
    let fine1 = TestProperty.shared.testFine.withReasonTemplate
    let reason = FirebaseReasonTemplate(id: (fine1.fineReason as! FineReasonTemplate).templateId, // swiftlint:disable:this force_cast
                                        reason: "asldkfj", importance: .low, amount: Amount(12, subUnit: 98))
    let callItem3 = FFChangeListCall(clubId: clubId, item: reason)
    try await FirebaseFunctionCaller.shared.call(callItem3)

    // Add fine with reason template
    let callItem1 = FFChangeListCall(clubId: clubId, item: fine1)
    try await FirebaseFunctionCaller.shared.call(callItem1)

    // Add fine with custom reason
    let fine2 = TestProperty.shared.testFine2.withReasonCustom
    let callItem2 = FFChangeListCall(clubId: clubId, item: fine2)
    try await FirebaseFunctionCaller.shared.call(callItem2)

    // Check fines and reason
    let fineList: [FirebaseFine] = try await FirebaseFetcher.shared.fetchList(clubId: clubId)
    let fetchedFine1 = fineList.first { $0.id == fine1.id }
    let fetchedFine2 = fineList.first { $0.id == fine2.id }
    XCTAssertEqual(fetchedFine1, fine1)
    XCTAssertEqual(fetchedFine2, fine2)

    let reasonList: [FirebaseReasonTemplate] = try await FirebaseFetcher.shared.fetchList(clubId: clubId)
    let fetchedReason = reasonList.first { $0.id == reason.id }
    XCTAssertEqual(fetchedReason, reason)
}*/
