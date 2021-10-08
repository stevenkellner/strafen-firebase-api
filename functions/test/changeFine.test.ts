import {privateKey} from "../src/privateKeys";
import {guid} from "../src/TypeDefinitions/guid";
import {auth, callFunction, getDatabaseFines, getDatabaseReasonTemplates, getDatabaseStatisticsPropertiesWithName, signInTestUser} from "./utils";
import {signOut} from "firebase/auth";
import {assert, AssertionError, expect} from "chai";
import {FirebaseError} from "firebase-admin";
import {ReasonTemplate} from "../src/TypeDefinitions/ReasonTemplate";
import {Fine} from "../src/TypeDefinitions/Fine";

describe("ChangeFine", () => {

    const clubId = guid.fromString("6fff234d-756b-4b53-9ae4-0f356ef189d1", undefined);

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
            await callFunction("changeFine", {
                privateKey: privateKey,
                clubLevel: "testing",
                changeType: "upate",
                fine: "some Fine",
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
            await callFunction("changeFine", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                fine: "some Fine",
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
            await callFunction("changeFine", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                changeType: "invalid",
                fine: "some Fine",
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

    it("No fine", async () => {
        try {
            await callFunction("changeFine", {
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
            expect((error as FirebaseError).message).to.equal("Couldn't parse 'fine'. Expected type 'object', but got undefined or null.");
        }
    });

    it("Invalid fine", async () => {
        try {
            await callFunction("changeFine", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                changeType: "update",
                fine: "invalid",
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse 'fine'. Expected type 'object', but got 'invalid' from type 'string'.");
        }
    });

    async function addReasonTemplate() {

        // Add reason
        const reasonTemplate = new ReasonTemplate.Builder().fromValue({
            id: "9d0681f0-2045-4a1d-abbc-6bb289934ff9",
            reason: "Test Reason 1",
            amount: 2.50,
            importance: "low",
        }, undefined);
        await callFunction("changeReasonTemplate", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            changeType: "update",
            reasonTemplate: reasonTemplate.serverObject,
            updateProperties: { // TODO: remove
                timestamp: 123456,
                personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
            },
        });

        // Check reason
        const reasonList = await getDatabaseReasonTemplates(clubId);
        const fetchedReason = reasonList.find(_reason => _reason.id.equals(reasonTemplate.id));
        expect(fetchedReason).to.deep.equal(reasonTemplate);
    }

    async function setFine(withTemplate: boolean, timestamp: number) {

        // Set fine
        const fine = new Fine.Builder().fromValue({
            id: "637d6187-68d2-4000-9cb8-7dfc3877d5ba",
            personId: "D1852AC0-A0E2-4091-AC7E-CB2C23F708D9",
            date: 9284765,
            payedState: {
                state: "unpayed",
                updateProperties: {
                    timestamp: 123456,
                    personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                },
            },
            number: 2,
            fineReason: withTemplate ? {
                reasonTemplateId: "9d0681f0-2045-4a1d-abbc-6bb289934ff9",
            } : {
                reason: "Reason",
                amount: 1.50,
                importance: "high",
            },
            updateProperties: {
                timestamp: timestamp,
                personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
            },
        }, undefined);

        await callFunction("changeFine", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            changeType: "update",
            fine: fine.serverObject,
        });

        // Check fine
        const fineList = await getDatabaseFines(clubId);
        const fetchedFine = fineList.find(_fine => _fine.id.equals(fine.id));
        expect(fetchedFine).to.deep.equal(fine);
    }

    it("Fine set", async () => {
        await addReasonTemplate();
        await setFine(true, 123456);

        // Check statistic
        const statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, "changeFine");
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            changedFine: {
                date: 9284765,
                fineReason: {
                    id: "9D0681F0-2045-4A1D-ABBC-6BB289934FF9",
                    reason: "Test Reason 1",
                    amount: 2.50,
                    importance: "low",
                },
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
            },
        });
    });

    it("Fine update custom reason", async () => {
        await addReasonTemplate();
        await setFine(true, 123456);
        await setFine(false, 123457);

        // Check statistic
        let statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, "changeFine");
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousFine != null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousFine: {
                date: 9284765,
                fineReason: {
                    id: "9D0681F0-2045-4A1D-ABBC-6BB289934FF9",
                    reason: "Test Reason 1",
                    amount: 2.50,
                    importance: "low",
                },
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
            },
            changedFine: {
                date: 9284765,
                fineReason: {
                    reason: "Reason",
                    amount: 1.50,
                    importance: "high",
                },
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
            },
        });
    });

    it("Fine update template id", async () => {
        await addReasonTemplate();
        await setFine(false, 123456);
        await setFine(true, 123457);

        // Check statistic
        let statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, "changeFine");
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousFine != null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousFine: {
                date: 9284765,
                fineReason: {
                    reason: "Reason",
                    amount: 1.50,
                    importance: "high",
                },
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
            },
            changedFine: {
                date: 9284765,
                fineReason: {
                    id: "9D0681F0-2045-4A1D-ABBC-6BB289934FF9",
                    reason: "Test Reason 1",
                    amount: 2.50,
                    importance: "low",
                },
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
            },
        });
    });

    it("Fine delete", async () => {
        await addReasonTemplate();
        await setFine(true, 123456);

        const fine = new Fine.Builder().fromValue({
            id: "637d6187-68d2-4000-9cb8-7dfc3877d5ba",
            personId: "D1852AC0-A0E2-4091-AC7E-CB2C23F708D9",
            date: 9284765,
            payedState: {
                state: "unpayed",
                updateProperties: {
                    timestamp: 123456,
                    personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                },
            },
            number: 2,
            fineReason: {
                reason: "Reason",
                amount: 1.50,
                importance: "high",
            },
            updateProperties: {
                timestamp: 123457,
                personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
            },
        }, undefined);

        await callFunction("changeFine", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            changeType: "delete",
            fine: fine.serverObject,
        });

        // Check fine
        const fineList = await getDatabaseFines(clubId);
        const fetchedFine = fineList.find(_fine => _fine.id.equals(fine.id));
        expect(fetchedFine).to.be.equal(undefined);

        // Check statistic
        let statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, "changeFine");
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousFine != null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousFine: {
                date: 9284765,
                fineReason: {
                    id: "9D0681F0-2045-4A1D-ABBC-6BB289934FF9",
                    reason: "Test Reason 1",
                    amount: 2.50,
                    importance: "low",
                },
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
            },
        });
    });

    // TODO: update deleted fine with lower timestamp
    // TODO: update deleted fine
});
