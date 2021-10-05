import {privateKey} from "../src/privateKeys";
import {guid} from "../src/TypeDefinitions/guid";
import {auth, callFunction, getDatabaseReasonTemplates, getDatabaseStatisticsPropertiesWithName, signInTestUser} from "./utils";
import {signOut} from "firebase/auth";
import {assert, AssertionError, expect} from "chai";
import {FirebaseError} from "firebase-admin";
import {ReasonTemplate} from "../src/TypeDefinitions/ReasonTemplate";

describe("ChangeReasonTemplate", () => {

    const clubId = guid.fromString("9e00bbc6-c1b4-4e6f-8919-77f01aa10749", undefined);

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
            await callFunction("changeReasonTemplate", {
                privateKey: privateKey,
                clubLevel: "testing",
                changeType: "upate",
                reasonTemplate: "some Fine",
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
            await callFunction("changeReasonTemplate", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                reasonTemplate: "some Reason",
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
            await callFunction("changeReasonTemplate", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                changeType: "invalid",
                reasonTemplate: "some Reason",
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

    it("No reason template", async () => {
        try {
            await callFunction("changeReasonTemplate", {
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
            expect((error as FirebaseError).message).to.equal("Couldn't parse 'reasonTemplate'. Expected type 'object', but got undefined or null.");
        }
    });

    it("Invalid reason template", async () => {
        try {
            await callFunction("changeReasonTemplate", {
                privateKey: privateKey,
                clubLevel: "testing",
                clubId: clubId.guidString,
                changeType: "update",
                reasonTemplate: "invalid",
            });
            assert.fail("A statement above should throw an exception.");
        } catch (error) {
            if (error instanceof AssertionError) {
                throw error;
            }
            expect((error as FirebaseError).code).to.equal("functions/invalid-argument");
            expect((error as FirebaseError).message).to.equal("Couldn't parse 'reasonTemplate'. Expected type 'object', but got 'invalid' from type 'string'.");
        }
    });

    async function setReasonTemplate(variant: boolean): Promise<ReasonTemplate> {
        const reasonTemplate = ReasonTemplate.fromObject(variant ? {
            id: "18ae484f-a1b7-456b-807e-339ff6679ad0",
            reason: "Reason",
            amount: 1.50,
            importance: "high",
        } : {
            id: "18ae484f-a1b7-456b-807e-339ff6679ad0",
            reason: "Reason asdf",
            amount: 150,
            importance: "medium",
        }, undefined);

        // Set reason template
        await callFunction("changeReasonTemplate", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            changeType: "update",
            reasonTemplate: reasonTemplate.object,
        });

        // Check reason template
        const reasonTemplateList = await getDatabaseReasonTemplates(clubId);
        const fetchedReasonTemplate = reasonTemplateList.find(_reasonTemplate => _reasonTemplate.id.equals(reasonTemplate.id));
        expect(fetchedReasonTemplate).to.deep.equal(reasonTemplate);

        return reasonTemplate;
    }

    it("Reason template set", async () => {
        const reasonTemplate = await setReasonTemplate(false);

        // Check statistic
        const statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, "changeReasonTemplate");
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            changedReasonTemplate: reasonTemplate.object,
        });
    });

    it("Reason template update", async () => {
        const reasonTemplate1 = await setReasonTemplate(false);
        const reasonTemplate2 = await setReasonTemplate(true);

        // Check statistic
        let statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, "changeReasonTemplate");
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousReasonTemplate != null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousReasonTemplate: reasonTemplate1.object,
            changedReasonTemplate: reasonTemplate2.object,
        });
    });

    it("Reason template delete", async () => {
        const reasonTemplate = await setReasonTemplate(true);

        await callFunction("changeReasonTemplate", {
            privateKey: privateKey,
            clubLevel: "testing",
            clubId: clubId.guidString,
            changeType: "delete",
            reasonTemplate: reasonTemplate.object,
        });

        // Check reasonTemplate
        const reasonTemplateList = await getDatabaseReasonTemplates(clubId);
        const fetchedReasonTemplate = reasonTemplateList.find(_reasonTemplate => _reasonTemplate.id.equals(reasonTemplate.id));
        expect(fetchedReasonTemplate).to.be.equal(undefined);

        // Check statistic
        let statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, "changeReasonTemplate");
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousReasonTemplate != null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousReasonTemplate: reasonTemplate.object,
        });
    });
});
