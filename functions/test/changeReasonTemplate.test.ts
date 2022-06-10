import { privateKey } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import { auth, callFunction, firebaseError, getDatabaseReasonTemplates, getDatabaseStatisticsPropertiesWithName, signInTestUser } from './utils';
import { signOut } from 'firebase/auth';
import { assert, expect } from 'chai';
import { ReasonTemplate } from '../src/TypeDefinitions/ReasonTemplate';
import { ParameterContainer } from '../src/TypeDefinitions/ParameterContainer';
import { Logger } from '../src/TypeDefinitions/LoggingProperties';
import { Updatable, UpdateProperties } from '../src/TypeDefinitions/UpdateProperties';

describe('ChangeReasonTemplate', () => {

    const loggingProperties = Logger.withFirst(new ParameterContainer({ verbose: true }), 'changeReasonTemplateTest', undefined, 'notice');

    const clubId = guid.fromString('9e00bbc6-c1b4-4e6f-8919-77f01aa10749', loggingProperties.nextIndent);

    beforeEach(async () => {
        await signInTestUser();
        await callFunction('newTestClub', {
            privateKey: privateKey,
            clubLevel: 'testing',
            clubId: clubId.guidString,
            testClubType: 'default',
        });
    });

    afterEach(async () => {
        await callFunction('deleteTestClubs', {
            privateKey: privateKey,
            clubLevel: 'testing',
        });
        await signOut(auth);
    });

    it('No club id', async () => {
        try {
            await callFunction('changeReasonTemplate', {
                privateKey: privateKey,
                clubLevel: 'testing',
                changeType: 'upate',
                reasonTemplate: 'some Fine',
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse \'clubId\'. Expected type \'string\', but got undefined or null.',
            });
        }
    });

    it('No change type', async () => {
        try {
            await callFunction('changeReasonTemplate', {
                privateKey: privateKey,
                clubLevel: 'testing',
                clubId: clubId.guidString,
                reasonTemplate: 'some Reason',
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse \'changeType\'. Expected type \'string\', but got undefined or null.',
            });
        }
    });

    it('Invalid change type', async () => {
        try {
            await callFunction('changeReasonTemplate', {
                privateKey: privateKey,
                clubLevel: 'testing',
                clubId: clubId.guidString,
                changeType: 'invalid',
                reasonTemplate: 'some Reason',
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse ChangeType, expected \'delete\' or \'update\', but got invalid instead.',
            });
        }
    });

    it('No reason template', async () => {
        try {
            await callFunction('changeReasonTemplate', {
                privateKey: privateKey,
                clubLevel: 'testing',
                clubId: clubId.guidString,
                changeType: 'update',
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse \'reasonTemplate\'. Expected type \'object\', but got undefined or null.',
            });
        }
    });

    it('Invalid reason template', async () => {
        try {
            await callFunction('changeReasonTemplate', {
                privateKey: privateKey,
                clubLevel: 'testing',
                clubId: clubId.guidString,
                changeType: 'update',
                reasonTemplate: 'invalid',
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse \'reasonTemplate\'. Expected type \'object\', but got \'invalid\' from type \'string\'.',
            });
        }
    });

    async function setReasonTemplate(variant: boolean, timestamp: Date): Promise<ReasonTemplate> {
        const reasonTemplate = new ReasonTemplate.Builder().fromValue(variant ? {
            id: '18ae484f-a1b7-456b-807e-339ff6679ad0',
            reason: 'Reason',
            amount: 1.50,
            importance: 'high',
        } : {
            id: '18ae484f-a1b7-456b-807e-339ff6679ad0',
            reason: 'Reason asdf',
            amount: 150,
            importance: 'medium',
        }, loggingProperties.nextIndent) as ReasonTemplate;
        expect(reasonTemplate).to.be.instanceOf(ReasonTemplate);

        // Set reason template
        const updatableReasonTemplate = new Updatable<ReasonTemplate>(reasonTemplate, new UpdateProperties(timestamp, guid.fromString('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7', loggingProperties.nextIndent)));
        await callFunction('changeReasonTemplate', {
            privateKey: privateKey,
            clubLevel: 'testing',
            clubId: clubId.guidString,
            changeType: 'update',
            reasonTemplate: updatableReasonTemplate.serverObject,
        });

        // Check reason template
        const reasonTemplateList = await getDatabaseReasonTemplates(clubId, loggingProperties.nextIndent);
        const fetchedReasonTemplate = reasonTemplateList.find(_reasonTemplate => _reasonTemplate.property.id.equals(reasonTemplate.id));
        expect(fetchedReasonTemplate?.property).to.deep.equal(reasonTemplate);

        return reasonTemplate;
    }

    it('Reason template set', async () => {
        const reasonTemplate = await setReasonTemplate(false, new Date('2011-10-15T10:42:38+0000'));

        // Check statistic
        const statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, 'changeReasonTemplate', loggingProperties.nextIndent);
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            changedReasonTemplate: reasonTemplate.serverObject,
        });
    });

    it('Reason template update', async () => {
        const reasonTemplate1 = await setReasonTemplate(false, new Date('2011-10-15T10:42:38+0000'));
        const reasonTemplate2 = await setReasonTemplate(true, new Date('2011-10-16T10:42:38+0000'));

        // Check statistic
        let statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, 'changeReasonTemplate', loggingProperties.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousReasonTemplate != null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousReasonTemplate: reasonTemplate1.serverObject,
            changedReasonTemplate: reasonTemplate2.serverObject,
        });
    });

    it('Reason template delete', async () => {
        const reasonTemplate = await setReasonTemplate(true, new Date('2011-10-15T10:42:38+0000'));

        await callFunction('changeReasonTemplate', {
            privateKey: privateKey,
            clubLevel: 'testing',
            clubId: clubId.guidString,
            changeType: 'delete',
            reasonTemplate: {
                id: reasonTemplate.id.guidString,
                deleted: true,
                updateProperties: {
                    timestamp: '2011-10-16T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });

        // Check reasonTemplate
        const reasonTemplateList = await getDatabaseReasonTemplates(clubId, loggingProperties.nextIndent);
        const fetchedReasonTemplate = reasonTemplateList.find(_reasonTemplate => _reasonTemplate.property.id.equals(reasonTemplate.id));
        expect(fetchedReasonTemplate?.property.serverObject).to.be.deep.equal({
            deleted: true,
        });

        // Check statistic
        let statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, 'changeReasonTemplate', loggingProperties.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousReasonTemplate != null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousReasonTemplate: reasonTemplate.serverObject,
        });
    });
});
