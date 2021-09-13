import {privateKey} from "../src/privateKeys";
import {guid} from "../src/TypeDefinitions/guid";
import {auth, callFunction, getDatabaseFines, getDatabaseReasonTemplates, getDatabaseStatisticsPropertiesWithName, signInTestUser} from "./utils";
import {assert, expect} from "chai";
import {signOut} from "firebase/auth";
import {FirebaseError} from "firebase/app";
import {Fine} from "../src/TypeDefinitions/Fine";
import {FineReasonTemplate} from "../src/TypeDefinitions/FineReason";
import {ReasonTemplate} from "../src/TypeDefinitions/ReasonTemplate";

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
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse Fine since no data exists in snapshot.");
        }
    });

    async function addFinesAndReason(fine2PersonId: guid = guid.fromString("D1852AC0-A0E2-4091-AC7E-CB2C23F708D9"), addReason = true) {

        // Add reason
        const fine1 = Fine.fromObject({
            id: guid.fromString("637d6187-68d2-4000-9cb8-7dfc3877d5ba").guidString,
            personId: guid.fromString("D1852AC0-A0E2-4091-AC7E-CB2C23F708D9").guidString,
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
        if (addReason) {
            await callFunction("changeReasonTemplate", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                changeType: "update",
                reasonTemplate: reason.object,
            });
        }

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
            personId: fine2PersonId.guidString,
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

        if (addReason) {
            const reasonList = await getDatabaseReasonTemplates(clubId);
            const fetchedReason = reasonList.find(_reason => _reason.id.equals(reason.id));
            expect(fetchedReason).to.deep.equal(reason);
        }
    }

    it("Change fine payed to payed 1", async () => {

        // Add fines and reason
        await addFinesAndReason();

        // Change fine payed
        const fineId = guid.fromString("637d6187-68d2-4000-9cb8-7dfc3877d5ba");
        await callFunction("changeFinePayed", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            fineId: fineId.guidString,
            state: {
                state: "payed",
                payDate: 12345,
                inApp: false,
            },
        });

        // Check fine payed
        const fineList = await getDatabaseFines(clubId);
        const fetchedFine = fineList.find(fine => fine.id.equals(fineId));
        expect(fetchedFine?.payedState.object).to.deep.equal({
            state: "payed",
            payDate: 12345,
            inApp: false,
        });

        // Check statistic
        const statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, "changeFinePayed");
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            changedState: {
                inApp: false,
                payDate: 12345,
                state: "payed",
            },
            previousFine: {
                date: 9284765,
                id: "637D6187-68D2-4000-9CB8-7DFC3877D5BA",
                number: 2,
                payedState: {
                    state: "unpayed",
                },
                person: {
                    id: "D1852AC0-A0E2-4091-AC7E-CB2C23F708D9",
                    name: {
                        first: "John",
                        last: "Doe",
                    },
                },
                fineReason: {
                    amount: 12.98,
                    id: "9D0681F0-2045-4A1D-ABBC-6BB289934FF9",
                    importance: "low",
                    reason: "asldkfj",
                },
            },
        });
    });

    it("Change fine payed to payed 2", async () => {

        // Add fines and reason
        await addFinesAndReason();

        // Change fine payed
        const fineId = guid.fromString("137d6187-68d2-4000-9cb8-7dfc3877d5ba");
        await callFunction("changeFinePayed", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            fineId: fineId.guidString,
            state: {
                state: "payed",
                payDate: 54321,
                inApp: true,
            },
        });

        // Check fine payed
        const fineList = await getDatabaseFines(clubId);
        const fetchedFine = fineList.find(fine => fine.id.equals(fineId));
        expect(fetchedFine?.payedState.object).to.deep.equal({
            state: "payed",
            payDate: 54321,
            inApp: true,
        });

        // Check statistic
        expect(await getDatabaseStatisticsPropertiesWithName(clubId, "changeFinePayed")).to.be.deep.equal([
            {
                changedState: {
                    state: "payed",
                    payDate: 54321,
                    inApp: true,
                },
                previousFine: {
                    date: 9284765,
                    id: "137D6187-68D2-4000-9CB8-7DFC3877D5BA",
                    number: 10,
                    payedState: {
                        inApp: false,
                        payDate: 234689,
                        state: "payed",
                    },
                    person: {
                        id: "D1852AC0-A0E2-4091-AC7E-CB2C23F708D9",
                        name: {
                            first: "John",
                            last: "Doe",
                        },
                    },
                    fineReason: {
                        amount: 1.50,
                        importance: "high",
                        reason: "Reason",
                    },
                },
            },
        ]);
    });

    it("Change fine payed to unpayed", async () => {

        // Add fines and reason
        await addFinesAndReason();

        // Change fine payed
        const fineId = guid.fromString("137d6187-68d2-4000-9cb8-7dfc3877d5ba");
        await callFunction("changeFinePayed", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            fineId: fineId.guidString,
            state: {
                state: "unpayed",
            },
        });

        // Check fine payed
        const fineList = await getDatabaseFines(clubId);
        const fetchedFine = fineList.find(fine => fine.id.equals(fineId));
        expect(fetchedFine?.payedState.object).to.deep.equal({
            state: "unpayed",
            inApp: null,
            payDate: null,
        });

        // Check statistic
        expect(await getDatabaseStatisticsPropertiesWithName(clubId, "changeFinePayed")).to.be.deep.equal([
            {
                changedState: {
                    state: "unpayed",
                },
                previousFine: {
                    date: 9284765,
                    id: "137D6187-68D2-4000-9CB8-7DFC3877D5BA",
                    number: 10,
                    payedState: {
                        inApp: false,
                        payDate: 234689,
                        state: "payed",
                    },
                    person: {
                        id: "D1852AC0-A0E2-4091-AC7E-CB2C23F708D9",
                        name: {
                            first: "John",
                            last: "Doe",
                        },
                    },
                    fineReason: {
                        amount: 1.50,
                        importance: "high",
                        reason: "Reason",
                    },
                },
            },
        ]);
    });

    it("Change fine payed to settled", async () => {

        // Add fines and reason
        await addFinesAndReason();

        // Change fine payed
        const fineId = guid.fromString("137d6187-68d2-4000-9cb8-7dfc3877d5ba");
        await callFunction("changeFinePayed", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            fineId: fineId.guidString,
            state: {
                state: "settled",
            },
        });

        // Check fine payed
        const fineList = await getDatabaseFines(clubId);
        const fetchedFine = fineList.find(fine => fine.id.equals(fineId));
        expect(fetchedFine?.payedState.object).to.deep.equal({
            state: "settled",
            inApp: null,
            payDate: null,
        });

        // Check statistic
        expect(await getDatabaseStatisticsPropertiesWithName(clubId, "changeFinePayed")).to.be.deep.equal([
            {
                changedState: {
                    state: "settled",
                },
                previousFine: {
                    date: 9284765,
                    id: "137D6187-68D2-4000-9CB8-7DFC3877D5BA",
                    number: 10,
                    payedState: {
                        inApp: false,
                        payDate: 234689,
                        state: "payed",
                    },
                    person: {
                        id: "D1852AC0-A0E2-4091-AC7E-CB2C23F708D9",
                        name: {
                            first: "John",
                            last: "Doe",
                        },
                    },
                    fineReason: {
                        amount: 1.50,
                        importance: "high",
                        reason: "Reason",
                    },
                },
            },
        ]);
    });

    it("No person for statistic", async () => {

        // Add fines and reason
        await addFinesAndReason(guid.fromString("ae7d6187-A0E2-4091-AC7E-CB2C23F708D9"));

        try {
            const fineId = guid.fromString("137d6187-68d2-4000-9cb8-7dfc3877d5ba");
            await callFunction("changeFinePayed", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                fineId: fineId.guidString,
                state: {
                    state: "unpayed",
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse Person since no data exists in snapshot.");
        }
    });

    it("No reason for statistic", async () => {

        // Add fines and reason
        await addFinesAndReason(undefined, false);

        try {
            const fineId = guid.fromString("637d6187-68d2-4000-9cb8-7dfc3877d5ba");
            await callFunction("changeFinePayed", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                fineId: fineId.guidString,
                state: {
                    state: "unpayed",
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse ReasonTemplate since no data exists in snapshot.");
        }

    });
});
