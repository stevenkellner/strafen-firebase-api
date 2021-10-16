import {privateKey} from "../src/privateKeys";
import {guid} from "../src/TypeDefinitions/guid";
import {auth, callFunction, firebaseError, getDatabaseOptionalValue, getDatabaseStatisticsPropertiesWithName, getDatabaseValue, signInTestUser} from "./utils";
import {signOut} from "firebase/auth";
import {assert, expect} from "chai";
import { LoggingProperties } from "../src/TypeDefinitions/LoggingProperties";
import { ParameterContainer } from "../src/TypeDefinitions/ParameterContainer";
import { LatePaymentInterest } from "../src/TypeDefinitions/LatePaymentInterest";
import { getUpdatable, Updatable, UpdateProperties } from "../src/TypeDefinitions/UpdateProperties";
import { Deleted } from "../src/utils";

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
            expect(firebaseError(error)).to.be.deep.equal({
                code: "functions/invalid-argument",
                message: "Couldn't parse 'clubId'. Expected type 'string', but got undefined or null.",
            });
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
            expect(firebaseError(error)).to.be.deep.equal({
                code: "functions/invalid-argument",
                message: "Couldn't parse 'changeType'. Expected type 'string', but got undefined or null.",
            });
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
            expect(firebaseError(error)).to.be.deep.equal({
                code: "functions/invalid-argument",
                message: "Couldn't parse ChangeType, expected 'delete' or 'update', but got invalid instead.",
            });
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
            expect(firebaseError(error)).to.be.deep.equal({
                code: "functions/invalid-argument",
                message: "Couldn't parse 'latePaymentInterest'. Expected type 'object', but got undefined or null.",
            });
        }
    });

    it("Invalid interest", async () => {
        try {
            await callFunction("changeLatePaymentInterest", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                changeType: "update",
                latePaymentInterest: "invalid",
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: "functions/invalid-argument",
                message: "Couldn't parse 'latePaymentInterest'. Expected type 'object', but got 'invalid' from type 'string'.",
            });
        }
    });

    async function setInterest(variant: boolean, timestamp: Date): Promise<LatePaymentInterest> {
        const interest = new LatePaymentInterest.Builder().fromValue(variant ? {
            interestFreePeriod: {
                value: 1,
                unit: "month",
            },
            interestPeriod: {
                value: 5,
                unit: "day",
            },
            interestRate: 0.12,
            compoundInterest: false,
        } : {

            interestFreePeriod: {
                value: 2,
                unit: "year",
            },
            interestPeriod: {
                value: 10,
                unit: "month",
            },
            interestRate: 0.05,
            compoundInterest: true,
        }, loggingProperties.nextIndent) as LatePaymentInterest;
        expect(interest).to.be.instanceOf(LatePaymentInterest);

        // Set interest
        const updatableInterest = new Updatable<LatePaymentInterest>(interest, new UpdateProperties(timestamp, guid.fromString("7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7", loggingProperties.nextIndent)));
        await callFunction("changeLatePaymentInterest", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            changeType: "update",
            latePaymentInterest: updatableInterest.serverObject,
        });

        // TOOD: Check interest
        const fetchedInterest = getUpdatable<LatePaymentInterest | Deleted<null>, LatePaymentInterest.Builder>(await getDatabaseValue(`testableClubs/${clubId.guidString}/latePaymentInterest`), new LatePaymentInterest.Builder(), loggingProperties.nextIndent);
        expect(fetchedInterest?.property).to.deep.equal(interest);

        return interest;
    }

    it("Interest set", async () => {
        const interest = await setInterest(false, new Date("2011-10-14T10:42:38+0000"));

        // Check statistic
        const statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, "changeLatePaymentInterest", loggingProperties.nextIndent);
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            changedInterest: interest.serverObject,
        });
    });

    it("Interest update", async () => {
        const interest1 = await setInterest(false, new Date("2011-10-14T10:42:38+0000"));
        const interest2 = await setInterest(false, new Date("2011-10-15T10:42:38+0000"));

        // Check statistic
        let statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, "changeLatePaymentInterest", loggingProperties.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousInterest!= null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            changedInterest: interest1.serverObject,
            previousInterest: interest2.serverObject,
        });
    });

    it("Interest delete", async () => {
        const interest = await setInterest(false, new Date("2011-10-14T10:42:38+0000"));

        await callFunction("changeLatePaymentInterest", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            changeType: "delete",
            latePaymentInterest: {
                deleted: true,
                updateProperties: {
                    timestamp: "2011-10-15T10:42:38+0000",
                    personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                },
            },
        });

        // Check interest
        const fetchedInterest = getUpdatable<LatePaymentInterest | Deleted<null>, LatePaymentInterest.Builder>(await getDatabaseValue(`testableClubs/${clubId.guidString}/latePaymentInterest`), new LatePaymentInterest.Builder(), loggingProperties.nextIndent);
        expect(fetchedInterest?.property.serverObject).to.deep.equal({
            deleted: true,
        });

        // Check statistic
        let statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, "changeLatePaymentInterest", loggingProperties.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousInterest!= null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousInterest: interest.serverObject,
        });
    });

    it("delete before adding interest", async () => {
        await callFunction("changeLatePaymentInterest", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            changeType: "delete",
            latePaymentInterest: {
                deleted: true,
                updateProperties: {
                    timestamp: "2011-10-15T10:42:38+0000",
                    personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                },
            },
        });

        // Check interest
        const interest = await getDatabaseOptionalValue(`testableClubs/${clubId.guidString}/latePaymentInterest`);
        expect(interest).to.be.null;
    });
});
