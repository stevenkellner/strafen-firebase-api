import { privateKey } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import { auth, callFunction, firebaseError, getDatabaseFines, getDatabaseReasonTemplates, getDatabaseStatisticsPropertiesWithName, signInTestUser } from './utils';
import { signOut } from 'firebase/auth';
import { assert, expect } from 'chai';
import { ReasonTemplate } from '../src/TypeDefinitions/ReasonTemplate';
import { Fine } from '../src/TypeDefinitions/Fine';
import { Logger } from '../src/TypeDefinitions/LoggingProperties';
import { ParameterContainer } from '../src/TypeDefinitions/ParameterContainer';
import { Updatable, UpdateProperties } from '../src/TypeDefinitions/UpdateProperties';

describe('ChangeFine', () => {

    const loggingProperties = Logger.withFirst(new ParameterContainer({ verbose: true }), 'changeFineTest', undefined, 'notice');

    const clubId = guid.fromString('6fff234d-756b-4b53-9ae4-0f356ef189d1', loggingProperties.nextIndent);

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
            await callFunction('changeFine', {
                privateKey: privateKey,
                clubLevel: 'testing',
                changeType: 'upate',
                fine: 'some Fine',
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
            await callFunction('changeFine', {
                privateKey: privateKey,
                clubLevel: 'testing',
                clubId: clubId.guidString,
                fine: 'some Fine',
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
            await callFunction('changeFine', {
                privateKey: privateKey,
                clubLevel: 'testing',
                clubId: clubId.guidString,
                changeType: 'invalid',
                fine: 'some Fine',
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse ChangeType, expected \'delete\' or \'update\', but got invalid instead.',
            });
        }
    });

    it('No fine', async () => {
        try {
            await callFunction('changeFine', {
                privateKey: privateKey,
                clubLevel: 'testing',
                clubId: clubId.guidString,
                changeType: 'update',
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse \'fine\'. Expected type \'object\', but got undefined or null.',
            });
        }
    });

    it('Invalid fine', async () => {
        try {
            await callFunction('changeFine', {
                privateKey: privateKey,
                clubLevel: 'testing',
                clubId: clubId.guidString,
                changeType: 'update',
                fine: 'invalid',
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse \'fine\'. Expected type \'object\', but got \'invalid\' from type \'string\'.',
            });
        }
    });

    async function addReasonTemplate() {

        // Add reason
        const reasonTemplate = new ReasonTemplate.Builder().fromValue({
            id: '9d0681f0-2045-4a1d-abbc-6bb289934ff9',
            reason: 'Test Reason 1',
            amount: 2.50,
            importance: 'low',
        }, loggingProperties.nextIndent) as ReasonTemplate;
        expect(reasonTemplate).to.be.instanceOf(ReasonTemplate);
        const updatableReasonTemplate = new Updatable<ReasonTemplate>(reasonTemplate, new UpdateProperties(new Date('2011-10-15T10:42:38+0000'), guid.fromString('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7', loggingProperties.nextIndent)));
        await callFunction('changeReasonTemplate', {
            privateKey: privateKey,
            clubLevel: 'testing',
            clubId: clubId.guidString,
            changeType: 'update',
            reasonTemplate: updatableReasonTemplate.serverObject,
        });

        // Check reason
        const reasonList = await getDatabaseReasonTemplates(clubId, loggingProperties.nextIndent);
        const fetchedReason = reasonList.find(_reason => _reason.property.id.equals(reasonTemplate.id))?.property;
        expect(fetchedReason).to.deep.equal(reasonTemplate);
    }

    async function setFine(withTemplate: boolean, timestamp: Date) {

        // Set fine
        const fine = new Fine.Builder().fromValue({
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
                reason: 'Reason',
                amount: 1.50,
                importance: 'high',
            },
        }, loggingProperties.nextIndent) as Fine;
        expect(fine).to.be.instanceOf(Fine);

        const updatableFine = new Updatable<Fine>(fine, new UpdateProperties(timestamp, guid.fromString('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7', loggingProperties.nextIndent)));
        await callFunction('changeFine', {
            privateKey: privateKey,
            clubLevel: 'testing',
            clubId: clubId.guidString,
            changeType: 'update',
            fine: updatableFine.serverObject,
        });

        // Check fine
        const fineList = await getDatabaseFines(clubId, loggingProperties.nextIndent);
        const fetchedFine = fineList.find(_fine => _fine.property.id.equals(fine.id))?.property;
        expect(fetchedFine).to.deep.equal(fine);
    }

    it('Fine set', async () => {
        await addReasonTemplate();
        await setFine(true, new Date('2011-10-15T10:42:38+0000'));

        // Check statistic
        const statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, 'changeFine', loggingProperties.nextIndent);
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            changedFine: {
                date: '2011-10-14T10:42:38.000Z',
                fineReason: {
                    id: '9D0681F0-2045-4A1D-ABBC-6BB289934FF9',
                    reason: 'Test Reason 1',
                    amount: 2.50,
                    importance: 'low',
                },
                id: '637D6187-68D2-4000-9CB8-7DFC3877D5BA',
                number: 2,
                payedState: {
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
        let statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, 'changeFine', loggingProperties.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousFine != null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousFine: {
                date: '2011-10-14T10:42:38.000Z',
                fineReason: {
                    id: '9D0681F0-2045-4A1D-ABBC-6BB289934FF9',
                    reason: 'Test Reason 1',
                    amount: 2.50,
                    importance: 'low',
                },
                id: '637D6187-68D2-4000-9CB8-7DFC3877D5BA',
                number: 2,
                payedState: {
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
                    reason: 'Reason',
                    amount: 1.50,
                    importance: 'high',
                },
                id: '637D6187-68D2-4000-9CB8-7DFC3877D5BA',
                number: 2,
                payedState: {
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
        let statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, 'changeFine', loggingProperties.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousFine != null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousFine: {
                date: '2011-10-14T10:42:38.000Z',
                fineReason: {
                    reason: 'Reason',
                    amount: 1.50,
                    importance: 'high',
                },
                id: '637D6187-68D2-4000-9CB8-7DFC3877D5BA',
                number: 2,
                payedState: {
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
                    reason: 'Test Reason 1',
                    amount: 2.50,
                    importance: 'low',
                },
                id: '637D6187-68D2-4000-9CB8-7DFC3877D5BA',
                number: 2,
                payedState: {
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

        const fineId = guid.fromString('637d6187-68d2-4000-9cb8-7dfc3877d5ba', loggingProperties);
        await callFunction('changeFine', {
            privateKey: privateKey,
            clubLevel: 'testing',
            clubId: clubId.guidString,
            changeType: 'delete',
            fine: {
                id: fineId.guidString,
                deleted: true,
                updateProperties: {
                    timestamp: '2011-10-16T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });

        // Check fine
        const fineList = await getDatabaseFines(clubId, loggingProperties.nextIndent);
        const fetchedFine = fineList.find(_fine => _fine.property.id.equals(fineId))?.property;
        expect(fetchedFine?.serverObject).to.be.deep.equal({
            deleted: true,
        });

        // Check statistic
        let statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, 'changeFine', loggingProperties.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.previousFine != null;
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            previousFine: {
                date: '2011-10-14T10:42:38.000Z',
                fineReason: {
                    id: '9D0681F0-2045-4A1D-ABBC-6BB289934FF9',
                    reason: 'Test Reason 1',
                    amount: 2.50,
                    importance: 'low',
                },
                id: '637D6187-68D2-4000-9CB8-7DFC3877D5BA',
                number: 2,
                payedState: {
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

    it('Update deleted fine with lower timestamp', async () => {
        await addReasonTemplate();
        await setFine(true, new Date('2011-10-15T10:42:38+0000'));

        // Delete fine
        const fineId = guid.fromString('637d6187-68d2-4000-9cb8-7dfc3877d5ba', loggingProperties);
        await callFunction('changeFine', {
            privateKey: privateKey,
            clubLevel: 'testing',
            clubId: clubId.guidString,
            changeType: 'delete',
            fine: {
                id: fineId.guidString,
                deleted: true,
                updateProperties: {
                    timestamp: '2011-10-16T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });

        // Check deleted fine
        const fineList = await getDatabaseFines(clubId, loggingProperties.nextIndent);
        const fetchedFine = fineList.find(_fine => _fine.property.id.equals(fineId))?.property;
        expect(fetchedFine?.serverObject).to.be.deep.equal({
            deleted: true,
        });

        // Update deleted fine
        const fine = new Fine.Builder().fromValue({
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
                reason: 'asdf',
                amount: 1.50,
                importance: 'medium',
            },
        }, loggingProperties) as Fine;
        expect(fine).to.be.instanceOf(Fine);
        const updatableFine = new Updatable<Fine>(fine, new UpdateProperties(new Date('2011-10-15T15:42:38+0000'), guid.fromString('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7', loggingProperties.nextIndent)));
        try {
            await callFunction('changeFine', {
                privateKey: privateKey,
                clubLevel: 'testing',
                clubId: clubId.guidString,
                changeType: 'update',
                fine: updatableFine.serverObject,
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/cancelled',
                message: 'Server value is newer or same old than updated value.',
            });
        }
    });

    it('Update deleted fine', async () => {
        await addReasonTemplate();
        await setFine(true, new Date('2011-10-15T10:42:38+0000'));

        // Delete fine
        const fineId = guid.fromString('637d6187-68d2-4000-9cb8-7dfc3877d5ba', loggingProperties);
        await callFunction('changeFine', {
            privateKey: privateKey,
            clubLevel: 'testing',
            clubId: clubId.guidString,
            changeType: 'delete',
            fine: {
                id: fineId.guidString,
                deleted: true,
                updateProperties: {
                    timestamp: '2011-10-16T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });

        // Check deleted fine
        const fineList = await getDatabaseFines(clubId, loggingProperties.nextIndent);
        const fetchedFine = fineList.find(_fine => _fine.property.id.equals(fineId))?.property;
        expect(fetchedFine?.serverObject).to.be.deep.equal({
            deleted: true,
        });

        // Update deleted fine
        const fine = new Fine.Builder().fromValue({
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
                reason: 'asdf',
                amount: 1.50,
                importance: 'medium',
            },
        }, loggingProperties) as Fine;
        expect(fine).to.be.instanceOf(Fine);
        const updatableFine = new Updatable<Fine>(fine, new UpdateProperties(new Date('2011-10-16T15:42:38+0000'), guid.fromString('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7', loggingProperties.nextIndent)));
        await callFunction('changeFine', {
            privateKey: privateKey,
            clubLevel: 'testing',
            clubId: clubId.guidString,
            changeType: 'update',
            fine: updatableFine.serverObject,
        });

        // Check statistics
        let statisticsList = await getDatabaseStatisticsPropertiesWithName(clubId, 'changeFine', loggingProperties.nextIndent);
        statisticsList = statisticsList.filter(statistic => {
            return statistic.changedFine != null && statistic.changedFine.fineReason.reason == 'asdf';
        });
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            changedFine: {
                date: '2011-10-14T10:42:38.000Z',
                fineReason: {
                    amount: 1.5,
                    importance: 'medium',
                    reason: 'asdf',
                },
                id: '637D6187-68D2-4000-9CB8-7DFC3877D5BA',
                number: 2,
                payedState: {
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
