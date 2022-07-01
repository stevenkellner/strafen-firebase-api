import { unhashedFunctionCallKey } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import {
    auth,
    callFunction,
    expectFunctionFailed, expectFunctionSuccess,
    getDatabaseReasonTemplates,
    getDatabaseStatisticsPropertyWithIdentifier,
    signInTestUser,
} from './utils';
import { signOut } from 'firebase/auth';
import { expect } from 'chai';
import { ReasonTemplate } from '../src/TypeDefinitions/ReasonTemplate';
import { Logger } from '../src/Logger';
import { DatabaseType } from '../src/TypeDefinitions/DatabaseType';
import { Updatable, UpdateProperties } from '../src/TypeDefinitions/Updatable';

describe('ChangeReasonTemplate', () => {

    const logger = Logger.start(true, 'changeReasonTemplateTest', {}, 'notice');

    const clubId = guid.fromString('9e00bbc6-c1b4-4e6f-8919-77f01aa10749', logger.nextIndent);

    beforeEach(async () => {
        await signInTestUser();
        const callResult = await callFunction('newTestClub', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            testClubType: 'default',
        });
        expectFunctionSuccess(callResult).to.be.equal(undefined);
    });

    afterEach(async () => {
        const callResult = await callFunction('deleteTestClubs', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
        });
        expectFunctionSuccess(callResult).to.be.equal(undefined);
        await signOut(auth);
    });

    it('No club id', async () => {
        const callResult = await callFunction('changeReasonTemplate', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            changeType: 'upate',
            reasonTemplate: 'some Fine',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'clubId\'. Expected type \'string\', but got undefined or null.',
        });
    });

    it('No change type', async () => {
        const callResult = await callFunction('changeReasonTemplate', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            reasonTemplate: 'some Reason',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'changeType\'. Expected type \'string\', but got undefined or null.',
        });
    });

    it('Invalid change type', async () => {
        const callResult = await callFunction('changeReasonTemplate', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'invalid',
            reasonTemplate: 'some Reason',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse ChangeType, expected \'delete\' or \'update\', but got invalid instead.',
        });
    });

    it('No reason template', async () => {
        const callResult = await callFunction('changeReasonTemplate', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'update',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            // eslint-disable-next-line max-len
            message: 'Couldn\'t parse \'updatableReasonTemplate\'. Expected type \'object\', but got undefined or null.',
        });
    });

    it('Invalid reason template', async () => {
        const callResult = await callFunction('changeReasonTemplate', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'update',
            updatableReasonTemplate: 'invalid',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            // eslint-disable-next-line max-len
            message: 'Couldn\'t parse \'updatableReasonTemplate\'. Expected type \'object\', but got \'invalid\' from type \'string\' instead.',
        });
    });

    // eslint-disable-next-line require-jsdoc
    async function setReasonTemplate(variant: boolean, timestamp: Date): Promise<ReasonTemplate> {
        const reasonTemplate = ReasonTemplate.fromObject(variant ? {
            id: '18ae484f-a1b7-456b-807e-339ff6679ad0',
            reasonMessage: 'Reason',
            amount: 1.50,
            importance: 'high',
        } : {
            id: '18ae484f-a1b7-456b-807e-339ff6679ad0',
            reasonMessage: 'Reason asdf',
            amount: 150,
            importance: 'medium',
        }, logger.nextIndent) as ReasonTemplate;
        expect(reasonTemplate).to.be.instanceOf(ReasonTemplate);

        // Set reason template
        const updatableReasonTemplate = new Updatable<ReasonTemplate>(
            reasonTemplate,
            new UpdateProperties(
                timestamp,
                guid.fromString('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7', logger.nextIndent)
            )
        );
        const callResult = await callFunction('changeReasonTemplate', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'update',
            updatableReasonTemplate: updatableReasonTemplate.databaseObject,
        });
        expectFunctionSuccess(callResult).to.be.equal(undefined);

        // Check reason template
        const reasonTemplateList = await getDatabaseReasonTemplates(clubId, logger.nextIndent);
        const fetchedReasonTemplate =
            reasonTemplateList.find(_reasonTemplate => _reasonTemplate.property.id.equals(reasonTemplate.id));
        expect(fetchedReasonTemplate?.property).to.deep.equal(reasonTemplate);

        return reasonTemplate;
    }

    it('Reason template set', async () => {
        const reasonTemplate = await setReasonTemplate(false, new Date('2011-10-15T10:42:38+0000'));

        // Check statistic
        const statisticsList =
            await getDatabaseStatisticsPropertyWithIdentifier(clubId, 'changeReasonTemplate', logger.nextIndent);
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousReasonTemplate: null,
            changedReasonTemplate: reasonTemplate.databaseObject,
        });
    });

    it('Reason template update', async () => {
        const reasonTemplate1 = await setReasonTemplate(false, new Date('2011-10-15T10:42:38+0000'));
        const reasonTemplate2 = await setReasonTemplate(true, new Date('2011-10-16T10:42:38+0000'));

        // Check statistic
        let statisticsList =
            await getDatabaseStatisticsPropertyWithIdentifier(clubId, 'changeReasonTemplate', logger.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousReasonTemplate != null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousReasonTemplate: reasonTemplate1.databaseObject,
            changedReasonTemplate: reasonTemplate2.databaseObject,
        });
    });

    it('Reason template delete', async () => {
        const reasonTemplate = await setReasonTemplate(true, new Date('2011-10-15T10:42:38+0000'));

        const callResult = await callFunction('changeReasonTemplate', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'delete',
            updatableReasonTemplate: {
                id: reasonTemplate.id.guidString,
                deleted: true,
                updateProperties: {
                    timestamp: '2011-10-16T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });
        expectFunctionSuccess(callResult).to.be.equal(undefined);

        // Check reasonTemplate
        const reasonTemplateList = await getDatabaseReasonTemplates(clubId, logger.nextIndent);
        const fetchedReasonTemplate =
            reasonTemplateList.find(_reasonTemplate => _reasonTemplate.property.id.equals(reasonTemplate.id));
        expect(fetchedReasonTemplate?.property.databaseObject).to.be.deep.equal({
            deleted: true,
        });

        // Check statistic
        let statisticsList =
            await getDatabaseStatisticsPropertyWithIdentifier(clubId, 'changeReasonTemplate', logger.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousReasonTemplate != null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousReasonTemplate: reasonTemplate.databaseObject,
            changedReasonTemplate: null,
        });
    });
});
