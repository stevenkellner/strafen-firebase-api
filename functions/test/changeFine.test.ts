import { unhashedFunctionCallKey } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import {
    auth,
    callFunction,
    expectFunctionSuccess, expectFunctionFailed,
    getDatabaseFines,
    getDatabaseReasonTemplates,
    getDatabaseStatisticsPropertyWithIdentifier,
    signInTestUser,
} from './utils';
import { signOut } from 'firebase/auth';
import { expect } from 'chai';
import { ReasonTemplate } from '../src/TypeDefinitions/ReasonTemplate';
import { Fine } from '../src/TypeDefinitions/Fine';
import { Logger } from '../src/Logger';
import { Updatable, UpdateProperties } from '../src/TypeDefinitions/Updatable';
import { DatabaseType } from '../src/TypeDefinitions/DatabaseType';

describe('ChangeFine', () => {

    const logger = Logger.start(true, 'changeFineTest', {}, 'notice');

    const clubId = guid.fromString('6fff234d-756b-4b53-9ae4-0f356ef189d1', logger.nextIndent);

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
        const callResult = await callFunction('changeFine', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            changeType: 'upate',
            fine: 'some Fine',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'clubId\'. Expected type \'string\', but got undefined or null.',
        });
    });

    it('No change type', async () => {
        const callResult = await callFunction('changeFine', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            fine: 'some Fine',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'changeType\'. Expected type \'string\', but got undefined or null.',
        });
    });

    it('Invalid change type', async () => {
        const callResult = await callFunction('changeFine', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'invalid',
            fine: 'some Fine',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse ChangeType, expected \'delete\' or \'update\', but got invalid instead.',
        });
    });

    it('No fine', async () => {
        const callResult = await callFunction('changeFine', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'update',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t parse \'updatableFine\'. Expected type \'object\', but got undefined or null.',
        });
    });

    it('Invalid fine', async () => {
        const callResult = await callFunction('changeFine', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'update',
            updatableFine: 'invalid',
        });
        expectFunctionFailed(callResult).to.be.deep.equal({
            code: 'invalid-argument',
            // eslint-disable-next-line max-len
            message: 'Couldn\'t parse \'updatableFine\'. Expected type \'object\', but got \'invalid\' from type \'string\' instead.',
        });
    });

    // eslint-disable-next-line require-jsdoc
    async function addReasonTemplate() {

        // Add reason
        const reasonTemplate = ReasonTemplate.fromObject({
            id: '9d0681f0-2045-4a1d-abbc-6bb289934ff9',
            reasonMessage: 'Test Reason 1',
            amount: 2.50,
            importance: 'low',
        }, logger.nextIndent) as ReasonTemplate;
        expect(reasonTemplate).to.be.instanceOf(ReasonTemplate);
        const updatableReasonTemplate = new Updatable<ReasonTemplate>(
            reasonTemplate,
            new UpdateProperties(
                new Date('2011-10-15T10:42:38+0000'),
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

        // Check reason
        const reasonList = await getDatabaseReasonTemplates(clubId, logger.nextIndent);
        const fetchedReason = reasonList.find(_reason => _reason.property.id.equals(reasonTemplate.id))?.property;
        expect(fetchedReason).to.deep.equal(reasonTemplate);
    }

    // eslint-disable-next-line require-jsdoc
    async function setFine(withTemplate: boolean, timestamp: Date) {

        // Set fine
        const fine = Fine.fromObject({
            id: '637d6187-68d2-4000-9cb8-7dfc3877d5ba',
            personId: 'D1852AC0-A0E2-4091-AC7E-CB2C23F708D9',
            date: '2011-10-14T10:42:38+0000',
            payedState: {
                state: 'unpayed',
                updateProperties: {
                    timestamp: '2011-10-14T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
            number: 2,
            fineReason: withTemplate ? {
                reasonTemplateId: '9d0681f0-2045-4a1d-abbc-6bb289934ff9',
            } : {
                reasonMessage: 'Reason',
                amount: 1.50,
                importance: 'high',
            },
        }, logger.nextIndent) as Fine;
        expect(fine).to.be.instanceOf(Fine);

        const updatableFine = new Updatable<Fine>(
            fine,
            new UpdateProperties(timestamp, guid.fromString('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7', logger.nextIndent))
        );
        const callResult = await callFunction('changeFine', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'update',
            updatableFine: updatableFine.databaseObject,
        });
        expectFunctionSuccess(callResult).to.be.equal(undefined);

        // Check fine
        const fineList = await getDatabaseFines(clubId, logger.nextIndent);
        const fetchedFine = fineList.find(_fine => _fine.property.id.equals(fine.id))?.property;
        expect(fetchedFine).to.deep.equal(fine);
    }

    it('Fine set', async () => {
        await addReasonTemplate();
        await setFine(true, new Date('2011-10-15T10:42:38+0000'));

        // Check statistic
        const statisticsList =
            await getDatabaseStatisticsPropertyWithIdentifier(clubId, 'changeFine', logger.nextIndent);
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousFine: null,
            changedFine: {
                date: '2011-10-14T10:42:38.000Z',
                fineReason: {
                    id: '9D0681F0-2045-4A1D-ABBC-6BB289934FF9',
                    reasonMessage: 'Test Reason 1',
                    amount: 2.50,
                    importance: 'low',
                },
                id: '637D6187-68D2-4000-9CB8-7DFC3877D5BA',
                number: 2,
                payedState: {
                    inApp: null,
                    payDate: null,
                    state: 'unpayed',
                },
                person: {
                    id: 'D1852AC0-A0E2-4091-AC7E-CB2C23F708D9',
                    name: {
                        first: 'John',
                        last: 'Doe',
                    },
                },
            },
        });
    });

    it('Fine update custom reason', async () => {
        await addReasonTemplate();
        await setFine(true, new Date('2011-10-15T10:42:38+0000'));
        await setFine(false, new Date('2011-10-16T10:42:38+0000'));

        // Check statistic
        let statisticsList = await getDatabaseStatisticsPropertyWithIdentifier(clubId, 'changeFine', logger.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousFine != null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousFine: {
                date: '2011-10-14T10:42:38.000Z',
                fineReason: {
                    id: '9D0681F0-2045-4A1D-ABBC-6BB289934FF9',
                    reasonMessage: 'Test Reason 1',
                    amount: 2.50,
                    importance: 'low',
                },
                id: '637D6187-68D2-4000-9CB8-7DFC3877D5BA',
                number: 2,
                payedState: {
                    inApp: null,
                    payDate: null,
                    state: 'unpayed',
                },
                person: {
                    id: 'D1852AC0-A0E2-4091-AC7E-CB2C23F708D9',
                    name: {
                        first: 'John',
                        last: 'Doe',
                    },
                },
            },
            changedFine: {
                date: '2011-10-14T10:42:38.000Z',
                fineReason: {
                    id: null,
                    reasonMessage: 'Reason',
                    amount: 1.50,
                    importance: 'high',
                },
                id: '637D6187-68D2-4000-9CB8-7DFC3877D5BA',
                number: 2,
                payedState: {
                    inApp: null,
                    payDate: null,
                    state: 'unpayed',
                },
                person: {
                    id: 'D1852AC0-A0E2-4091-AC7E-CB2C23F708D9',
                    name: {
                        first: 'John',
                        last: 'Doe',
                    },
                },
            },
        });
    });

    it('Fine update template id', async () => {
        await addReasonTemplate();
        await setFine(false, new Date('2011-10-15T10:42:38+0000'));
        await setFine(true, new Date('2011-10-16T10:42:38+0000'));

        // Check statistic
        let statisticsList = await getDatabaseStatisticsPropertyWithIdentifier(clubId, 'changeFine', logger.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousFine != null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousFine: {
                date: '2011-10-14T10:42:38.000Z',
                fineReason: {
                    id: null,
                    reasonMessage: 'Reason',
                    amount: 1.50,
                    importance: 'high',
                },
                id: '637D6187-68D2-4000-9CB8-7DFC3877D5BA',
                number: 2,
                payedState: {
                    inApp: null,
                    payDate: null,
                    state: 'unpayed',
                },
                person: {
                    id: 'D1852AC0-A0E2-4091-AC7E-CB2C23F708D9',
                    name: {
                        first: 'John',
                        last: 'Doe',
                    },
                },
            },
            changedFine: {
                date: '2011-10-14T10:42:38.000Z',
                fineReason: {
                    id: '9D0681F0-2045-4A1D-ABBC-6BB289934FF9',
                    reasonMessage: 'Test Reason 1',
                    amount: 2.50,
                    importance: 'low',
                },
                id: '637D6187-68D2-4000-9CB8-7DFC3877D5BA',
                number: 2,
                payedState: {
                    inApp: null,
                    payDate: null,
                    state: 'unpayed',
                },
                person: {
                    id: 'D1852AC0-A0E2-4091-AC7E-CB2C23F708D9',
                    name: {
                        first: 'John',
                        last: 'Doe',
                    },
                },
            },
        });
    });

    it('Fine delete', async () => {
        await addReasonTemplate();
        await setFine(true, new Date('2011-10-15T10:42:38+0000'));

        const fineId = guid.fromString('637d6187-68d2-4000-9cb8-7dfc3877d5ba', logger);
        const callResult = await callFunction('changeFine', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'delete',
            updatableFine: {
                id: fineId.guidString,
                deleted: true,
                updateProperties: {
                    timestamp: '2011-10-16T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });
        expectFunctionSuccess(callResult).to.be.equal(undefined);

        // Check fine
        const fineList = await getDatabaseFines(clubId, logger.nextIndent);
        const fetchedFine = fineList.find(_fine => _fine.property.id.equals(fineId))?.property;
        expect(fetchedFine?.databaseObject).to.be.deep.equal({
            deleted: true,
        });

        // Check statistic
        let statisticsList = await getDatabaseStatisticsPropertyWithIdentifier(clubId, 'changeFine', logger.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousFine != null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousFine: {
                date: '2011-10-14T10:42:38.000Z',
                fineReason: {
                    id: '9D0681F0-2045-4A1D-ABBC-6BB289934FF9',
                    reasonMessage: 'Test Reason 1',
                    amount: 2.50,
                    importance: 'low',
                },
                id: '637D6187-68D2-4000-9CB8-7DFC3877D5BA',
                number: 2,
                payedState: {
                    inApp: null,
                    payDate: null,
                    state: 'unpayed',
                },
                person: {
                    id: 'D1852AC0-A0E2-4091-AC7E-CB2C23F708D9',
                    name: {
                        first: 'John',
                        last: 'Doe',
                    },
                },
            },
            changedFine: null,
        });
    });

    it('Update deleted fine with lower timestamp', async () => {
        await addReasonTemplate();
        await setFine(true, new Date('2011-10-15T10:42:38+0000'));

        // Delete fine
        const fineId = guid.fromString('637d6187-68d2-4000-9cb8-7dfc3877d5ba', logger);
        const callResult1 = await callFunction('changeFine', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'delete',
            updatableFine: {
                id: fineId.guidString,
                deleted: true,
                updateProperties: {
                    timestamp: '2011-10-16T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });
        expectFunctionSuccess(callResult1).to.be.equal(undefined);

        // Check deleted fine
        const fineList = await getDatabaseFines(clubId, logger.nextIndent);
        const fetchedFine = fineList.find(_fine => _fine.property.id.equals(fineId))?.property;
        expect(fetchedFine?.databaseObject).to.be.deep.equal({
            deleted: true,
        });

        // Update deleted fine
        const fine = Fine.fromObject({
            id: fineId.guidString,
            personId: 'D1852AC0-A0E2-4091-AC7E-CB2C23F708D9',
            date: '2011-10-14T10:42:38+0000',
            payedState: {
                state: 'settled',
                updateProperties: {
                    timestamp: '2011-10-14T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
            number: 2,
            fineReason: {
                reasonMessage: 'asdf',
                amount: 1.50,
                importance: 'medium',
            },
        }, logger) as Fine;
        expect(fine).to.be.instanceOf(Fine);
        const updatableFine = new Updatable<Fine>(
            fine,
            new UpdateProperties(
                new Date('2011-10-15T15:42:38+0000'),
                guid.fromString('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7', logger.nextIndent)
            )
        );
        const callResult2 = await callFunction('changeFine', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'update',
            updatableFine: updatableFine.databaseObject,
        });
        expectFunctionFailed(callResult2).to.be.deep.equal({
            code: 'cancelled',
            message: 'Server value is newer or same old than updated value.',
        });
    });

    it('Update deleted fine', async () => {
        await addReasonTemplate();
        await setFine(true, new Date('2011-10-15T10:42:38+0000'));

        // Delete fine
        const fineId = guid.fromString('637d6187-68d2-4000-9cb8-7dfc3877d5ba', logger);
        const callResult1 = await callFunction('changeFine', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'delete',
            updatableFine: {
                id: fineId.guidString,
                deleted: true,
                updateProperties: {
                    timestamp: '2011-10-16T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });
        expectFunctionSuccess(callResult1).to.be.equal(undefined);

        // Check deleted fine
        const fineList = await getDatabaseFines(clubId, logger.nextIndent);
        const fetchedFine = fineList.find(_fine => _fine.property.id.equals(fineId))?.property;
        expect(fetchedFine?.databaseObject).to.be.deep.equal({
            deleted: true,
        });

        // Update deleted fine
        const fine = Fine.fromObject({
            id: fineId.guidString,
            personId: 'D1852AC0-A0E2-4091-AC7E-CB2C23F708D9',
            date: '2011-10-14T10:42:38+0000',
            payedState: {
                state: 'settled',
                updateProperties: {
                    timestamp: '2011-10-14T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
            number: 2,
            fineReason: {
                reasonMessage: 'asdf',
                amount: 1.50,
                importance: 'medium',
            },
        }, logger) as Fine;
        expect(fine).to.be.instanceOf(Fine);
        const updatableFine = new Updatable<Fine>(
            fine,
            new UpdateProperties(
                new Date('2011-10-16T15:42:38+0000'),
                guid.fromString('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7', logger.nextIndent)
            )
        );
        const callResult2 = await callFunction('changeFine', {
            privateKey: unhashedFunctionCallKey(new DatabaseType('testing')),
            clubId: clubId.guidString,
            changeType: 'update',
            updatableFine: updatableFine.databaseObject,
        });
        expectFunctionSuccess(callResult2).to.be.equal(undefined);

        // Check statistics
        let statisticsList = await getDatabaseStatisticsPropertyWithIdentifier(clubId, 'changeFine', logger.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.changedFine != null && statistic.changedFine.fineReason.reasonMessage == 'asdf';
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousFine: null,
            changedFine: {
                date: '2011-10-14T10:42:38.000Z',
                fineReason: {
                    id: null,
                    amount: 1.5,
                    importance: 'medium',
                    reasonMessage: 'asdf',
                },
                id: '637D6187-68D2-4000-9CB8-7DFC3877D5BA',
                number: 2,
                payedState: {
                    inApp: null,
                    payDate: null,
                    state: 'settled',
                },
                person: {
                    id: 'D1852AC0-A0E2-4091-AC7E-CB2C23F708D9',
                    name: {
                        first: 'John',
                        last: 'Doe',
                    },
                },
            },
        });
    });
});
