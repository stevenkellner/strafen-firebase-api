import {privateKey} from "../src/privateKeys";
import {guid} from "../src/TypeDefinitions/guid";
import {auth, callFunction, getDatabaseFines, getDatabaseReasonTemplates, getDatabaseStatisticsPropertiesWithName, signInTestUser} from "./utils";
import {assert, AssertionError, expect} from "chai";
import {signOut} from "firebase/auth";
import {FirebaseError} from "firebase/app";
import {Fine} from "../src/TypeDefinitions/Fine";
import {FineReason} from "../src/TypeDefinitions/FineReason";
import {ReasonTemplate} from "../src/TypeDefinitions/ReasonTemplate";

describe("ChangeFinePayed", () => {

    const clubId = guid.fromString("1992af26-8b42-4452-a564-7e376b6401db", undefined);

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
                updateProperties: {
                    timestamp: 123456,
                    personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.be.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.be.equal("Couldn't parse 'clubId'. Expected type 'string', but got undefined or null.");
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
                updateProperties: {
                    timestamp: 123456,
                    personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.be.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.be.equal("Couldn't parse 'fineId'. Expected type 'string', but got undefined or null.");
        }
    });

    it("No state", async () => {
        try {
            await callFunction("changeFinePayed", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                updateProperties: {
                    timestamp: 123456,
                    personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.be.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.be.equal("Couldn't parse 'state'. Expected type 'object', but got undefined or null.");
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
                updateProperties: {
                    timestamp: 123456,
                    personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.be.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.be.equal("Couldn't parse PayedState parameter 'state'. Expected values 'payed', 'settled' or 'unpayed' from type 'string', but got 'invalid state' from type 'string'.");
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
                updateProperties: {
                    timestamp: 123456,
                    personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.be.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.be.equal("Couldn't parse PayedState since state is 'payed' but payDate or inApp is null.");
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
                updateProperties: {
                    timestamp: 123456,
                    personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.be.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.be.equal("Couldn't parse PayedState since state is 'payed' but payDate or inApp is null.");
        }
    });

    it("No update properties", async () => {
        try {
            await callFunction("changeFinePayed", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                state: {
                    state: "payed",
                    payDate: 123456789,
                    inApp: false,
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.be.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.be.equal("Couldn't parse payed state parameter 'updateProperties', expected type object but got 'undefined' from type 'undefined'.");
        }
    });

    it("Invalid update properties", async () => {
        try {
            await callFunction("changeFinePayed", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                state: {
                    state: "payed",
                    payDate: 123456789,
                    inApp: false,
                    updateProperties: "invalid",
                },
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.be.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.be.equal("Couldn't parse payed state parameter 'updateProperties', expected type object but got 'invalid' from type 'string'.");
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
            expect((error as FirebaseError).code).to.be.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.be.equal("Couldn't parse Fine since no data exists in snapshot.");
        }
    });

    async function addFinesAndReason(fine2PersonId: guid = guid.fromString("D1852AC0-A0E2-4091-AC7E-CB2C23F708D9", undefined), addReason = true) {

        // Add reason
        const fine1 = new Fine.Builder().fromValue({
            id: guid.fromString("637d6187-68d2-4000-9cb8-7dfc3877d5ba", undefined).guidString,
            personId: guid.fromString("D1852AC0-A0E2-4091-AC7E-CB2C23F708D9", undefined).guidString,
            date: 9284765,
            payedState: {
                state: "unpayed",
                updateProperties: {
                    timestamp: 123455,
                    personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                },
            },
            number: 2,
            fineReason: {
                reasonTemplateId: guid.fromString("9d0681f0-2045-4a1d-abbc-6bb289934ff9", undefined).guidString,
            },
            updateProperties: {
                timestamp: 123455,
                personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
            },
        }, undefined);
        const reason = new ReasonTemplate.Builder().fromValue({
            id: (fine1.fineReason.value as FineReason.WithTemplate).reasonTemplateId.guidString,
            reason: "asldkfj",
            importance: "low",
            amount: 12.98,
        }, undefined);
        if (addReason) {
            await callFunction("changeReasonTemplate", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                changeType: "update",
                reasonTemplate: reason.serverObject,
                updateProperties: { // TODO remove
                    timestamp: 123455,
                    personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                },
            });
        }

        // Add fine with reason template
        await callFunction("changeFine", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            changeType: "update",
            fine: fine1.serverObject,
        });

        // Add fine with custom reason
        const fine2 = new Fine.Builder().fromValue({
            id: guid.fromString("137d6187-68d2-4000-9cb8-7dfc3877d5ba", undefined).guidString,
            personId: fine2PersonId.guidString,
            date: 9284765,
            payedState: {
                state: "payed",
                inApp: false,
                payDate: 234689,
                updateProperties: {
                    timestamp: 123455,
                    personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                },
            },
            number: 10,
            fineReason: {
                reason: "Reason",
                amount: 1.50,
                importance: "high",
            },
            updateProperties: {
                timestamp: 123455,
                personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
            },
        }, undefined);
        await callFunction("changeFine", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            changeType: "update",
            fine: fine2.serverObject,
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
        const fineId = guid.fromString("637d6187-68d2-4000-9cb8-7dfc3877d5ba", undefined);
        await callFunction("changeFinePayed", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            fineId: fineId.guidString,
            state: {
                state: "payed",
                payDate: 12345,
                inApp: false,
                updateProperties: {
                    timestamp: 123456,
                    personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                },
            },
        });

        // Check fine payed
        const fineList = await getDatabaseFines(clubId);
        const fetchedFine = fineList.find(fine => fine.id.equals(fineId));
        expect(fetchedFine?.payedState.serverObject).to.deep.equal({
            state: "payed",
            payDate: 12345,
            inApp: false,
            updateProperties: {
                timestamp: 123456,
                personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
            },
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
        const fineId = guid.fromString("137d6187-68d2-4000-9cb8-7dfc3877d5ba", undefined);
        await callFunction("changeFinePayed", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            fineId: fineId.guidString,
            state: {
                state: "payed",
                payDate: 54321,
                inApp: true,
                updateProperties: {
                    timestamp: 123456,
                    personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                },
            },
        });

        // Check fine payed
        const fineList = await getDatabaseFines(clubId);
        const fetchedFine = fineList.find(fine => fine.id.equals(fineId));
        expect(fetchedFine?.payedState.serverObject).to.deep.equal({
            state: "payed",
            payDate: 54321,
            inApp: true,
            updateProperties: {
                timestamp: 123456,
                personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
            },
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
        const fineId = guid.fromString("137d6187-68d2-4000-9cb8-7dfc3877d5ba", undefined);
        await callFunction("changeFinePayed", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            fineId: fineId.guidString,
            state: {
                state: "unpayed",
                updateProperties: {
                    timestamp: 123456,
                    personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                },
            },
        });

        // Check fine payed
        const fineList = await getDatabaseFines(clubId);
        const fetchedFine = fineList.find(fine => fine.id.equals(fineId));
        expect(fetchedFine?.payedState.serverObject).to.deep.equal({
            state: "unpayed",
            inApp: null,
            payDate: null,
            updateProperties: {
                timestamp: 123456,
                personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
            },
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
        const fineId = guid.fromString("137d6187-68d2-4000-9cb8-7dfc3877d5ba", undefined);
        await callFunction("changeFinePayed", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            fineId: fineId.guidString,
            state: {
                state: "settled",
                updateProperties: {
                    timestamp: 123456,
                    personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                },
            },
        });

        // Check fine payed
        const fineList = await getDatabaseFines(clubId);
        const fetchedFine = fineList.find(fine => fine.id.equals(fineId));
        expect(fetchedFine?.payedState.serverObject).to.deep.equal({
            state: "settled",
            inApp: null,
            payDate: null,
            updateProperties: {
                timestamp: 123456,
                personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
            },
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

    // TODO: change state of deleted fine
});
