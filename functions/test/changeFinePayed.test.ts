import { privateKey } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import {
    auth,
    callFunction,
    firebaseError,
    getDatabaseFines,
    getDatabaseReasonTemplates,
    getDatabaseStatisticsPropertyWithIdentifier,
    signInTestUser,
} from './utils';
import { assert, expect } from 'chai';
import { signOut } from 'firebase/auth';
import { Fine } from '../src/TypeDefinitions/Fine';
import { FineReason } from '../src/TypeDefinitions/FineReason';
import { ReasonTemplate } from '../src/TypeDefinitions/ReasonTemplate';
import { Updatable, UpdateProperties } from '../src/TypeDefinitions/UpdateProperties';
import { Logger } from '../src/Logger';
import { ParameterContainer } from '../src/ParameterContainer';

describe('ChangeFinePayed', () => {

    const logger = Logger.start(new ParameterContainer({ verbose: true }), 'changeFinePayedTest', {}, 'notice');

    const clubId = guid.fromString('1992af26-8b42-4452-a564-7e376b6401db', logger.nextIndent);

    beforeEach(async () => {
        await signInTestUser();
        await callFunction('newTestClub', {
            privateKey: privateKey,
            databaseType: 'testing',
            clubId: clubId.guidString,
            testClubType: 'default',
        });
    });

    afterEach(async () => {
        await callFunction('deleteTestClubs', {
            privateKey: privateKey,
            databaseType: 'testing',
        });
        await signOut(auth);
    });

    it('No club id', async () => {
        try {
            await callFunction('changeFinePayed', {
                privateKey: privateKey,
                databaseType: 'testing',
                fineId: guid.newGuid().guidString,
                state: {
                    state: 'unpayed',
                },
                updateProperties: {
                    timestamp: 123456,
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse \'clubId\'. Expected type \'string\', but got undefined or null.',
            });
        }
    });

    it('No fine id', async () => {
        try {
            await callFunction('changeFinePayed', {
                privateKey: privateKey,
                databaseType: 'testing',
                clubId: guid.newGuid().guidString,
                state: {
                    state: 'unpayed',
                },
                updateProperties: {
                    timestamp: '2011-10-14T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse \'fineId\'. Expected type \'string\', but got undefined or null.',
            });
        }
    });

    it('No state', async () => {
        try {
            await callFunction('changeFinePayed', {
                privateKey: privateKey,
                databaseType: 'testing',
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                updateProperties: {
                    timestamp: '2011-10-14T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                // eslint-disable-next-line max-len
                message: 'Couldn\'t parse \'updatablePayedState\'. Expected type \'object\', but got undefined or null.',
            });
        }
    });

    it('Invalid state.state', async () => {
        try {
            await callFunction('changeFinePayed', {
                privateKey: privateKey,
                databaseType: 'testing',
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                updatablePayedState: {
                    state: 'invalid state',
                },
                updateProperties: {
                    timestamp: '2011-10-14T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                // eslint-disable-next-line max-len
                message: 'Couldn\'t parse PayedState parameter \'state\'. Expected values \'payed\', \'settled\' or \'unpayed\', but got \'invalid state\' from type \'string\'.',
            });
        }
    });

    it('Invalid state payed no payDate', async () => {
        try {
            await callFunction('changeFinePayed', {
                privateKey: privateKey,
                databaseType: 'testing',
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                updatablePayedState: {
                    state: 'payed',
                },
                updateProperties: {
                    timestamp: '2011-10-14T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                // eslint-disable-next-line max-len
                message: 'Couldn\'t parse PayedState parameter \'payDate\', expected iso string, but got \'undefined\' from type undefined',
            });
        }
    });

    it('Invalid state payed no inApp', async () => {
        try {
            await callFunction('changeFinePayed', {
                privateKey: privateKey,
                databaseType: 'testing',
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                updatablePayedState: {
                    state: 'payed',
                    payDate: '2011-10-14T10:42:38+0000',
                },
                updateProperties: {
                    timestamp: '2011-10-14T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                // eslint-disable-next-line max-len
                message: 'Couldn\'t parse PayedState parameter \'inApp\'. Expected type \'boolean\', but got \'undefined\' from type \'undefined\'.',
            });
        }
    });

    it('No update properties', async () => {
        try {
            await callFunction('changeFinePayed', {
                privateKey: privateKey,
                databaseType: 'testing',
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                updatablePayedState: {
                    state: 'payed',
                    payDate: '2011-10-14T10:42:38+0000',
                    inApp: false,
                },
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                // eslint-disable-next-line max-len
                message: 'Couldn\'t parse update properties, expected type \'object\', but bot undefined from type \'undefined\'',
            });
        }
    });

    it('Invalid update properties', async () => {
        try {
            await callFunction('changeFinePayed', {
                privateKey: privateKey,
                databaseType: 'testing',
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                updatablePayedState: {
                    state: 'payed',
                    payDate: '2011-10-14T10:42:38+0000',
                    inApp: false,
                    updateProperties: {
                        asdf: 'invalid',
                    },
                },
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                // eslint-disable-next-line max-len
                message: 'Couldn\'t parse UpdateProperties parameter \'personId\', expected type string but got \'undefined\' from type undefined',
            });
        }
    });

    it('Not existing fine', async () => {
        try {
            await callFunction('changeFinePayed', {
                privateKey: privateKey,
                databaseType: 'testing',
                clubId: clubId.guidString,
                fineId: guid.newGuid().guidString,
                updatablePayedState: {
                    state: 'unpayed',
                    updateProperties: {
                        timestamp: '2011-10-14T10:42:38+0000',
                        personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                    },
                },
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse Fine since no data exists in snapshot.',
            });
        }
    });

    // eslint-disable-next-line require-jsdoc
    async function addFinesAndReason(
        fine2PersonId: guid = guid.fromString('D1852AC0-A0E2-4091-AC7E-CB2C23F708D9', logger.nextIndent),
        addReason = true
    ) {

        // Add reason
        const fine1 = Fine.fromObject({
            id: guid.fromString('637d6187-68d2-4000-9cb8-7dfc3877d5ba', logger.nextIndent).guidString,
            personId: guid.fromString('D1852AC0-A0E2-4091-AC7E-CB2C23F708D9', logger.nextIndent).guidString,
            date: '2011-10-14T10:42:38+0000',
            payedState: {
                state: 'unpayed',
                updateProperties: {
                    timestamp: '2011-10-14T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
            number: 2,
            fineReason: {
                reasonTemplateId: guid.fromString('9d0681f0-2045-4a1d-abbc-6bb289934ff9', logger.nextIndent).guidString,
            },
        }, logger.nextIndent) as Fine;
        expect(fine1).to.be.instanceOf(Fine);
        const updatableFine1 = new Updatable<Fine>(
            fine1,
            new UpdateProperties(
                new Date('2011-10-14T10:42:38+0000'),
                guid.fromString('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7', logger.nextIndent)
            )
        );
        const reason = ReasonTemplate.fromObject({
            id: (fine1.fineReason.value as FineReason.Template).reasonTemplateId.guidString,
            reasonMessage: 'asldkfj',
            importance: 'low',
            amount: 12.98,
        }, logger.nextIndent) as ReasonTemplate;
        expect(reason).to.be.instanceOf(ReasonTemplate);
        const updatableReason = new Updatable<ReasonTemplate>(
            reason,
            new UpdateProperties(
                new Date('2011-10-15T10:42:38+0000'),
                guid.fromString('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7', logger.nextIndent)
            )
        );
        if (addReason) {
            await callFunction('changeReasonTemplate', {
                privateKey: privateKey,
                databaseType: 'testing',
                clubId: clubId.guidString,
                changeType: 'update',
                reasonTemplate: updatableReason.databaseObject,
            });
        }

        // Add fine with reason template
        await callFunction('changeFine', {
            privateKey: privateKey,
            databaseType: 'testing',
            clubId: clubId.guidString,
            changeType: 'update',
            fine: updatableFine1.databaseObject,
        });

        // Add fine with custom reason
        const fine2 = Fine.fromObject({
            id: guid.fromString('137d6187-68d2-4000-9cb8-7dfc3877d5ba', logger.nextIndent).guidString,
            personId: fine2PersonId.guidString,
            date: '2011-10-14T10:42:38+0000',
            payedState: {
                state: 'payed',
                inApp: false,
                payDate: '2011-10-14T10:42:38+0000',
                updateProperties: {
                    timestamp: '2011-10-14T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
            number: 10,
            fineReason: {
                reasonMessage: 'Reason',
                amount: 1.50,
                importance: 'high',
            },
            updateProperties: {
                timestamp: '2011-10-14T10:42:38+0000',
                personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        }, logger.nextIndent) as Fine;
        expect(fine2).to.be.instanceOf(Fine);
        const updatableFine2 = new Updatable<Fine>(
            fine2,
            new UpdateProperties(
                new Date('2011-10-14T10:42:38+0000'),
                guid.fromString('7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7', logger.nextIndent)
            )
        );
        await callFunction('changeFine', {
            privateKey: privateKey,
            databaseType: 'testing',
            clubId: clubId.guidString,
            changeType: 'update',
            fine: updatableFine2.databaseObject,
        });

        // Check fines and reason
        const fineList = await getDatabaseFines(clubId, logger.nextIndent);
        const fetchedFine1 = fineList.find(fine => fine.property.id.equals(fine1.id))?.property;
        const fetchedFine2 = fineList.find(fine => fine.property.id.equals(fine2.id))?.property;
        expect(fetchedFine1).to.deep.equal(fine1);
        expect(fetchedFine2).to.deep.equal(fine2);

        if (addReason) {
            const reasonList = await getDatabaseReasonTemplates(clubId, logger.nextIndent);
            const fetchedReason = reasonList.find(_reason => _reason.property.id.equals(reason.id));
            expect(fetchedReason?.property).to.deep.equal(reason);
        }
    }

    it('Change fine payed to payed 1', async () => {

        // Add fines and reason
        await addFinesAndReason();

        // Change fine payed
        const fineId = guid.fromString('637d6187-68d2-4000-9cb8-7dfc3877d5ba', logger.nextIndent);
        await callFunction('changeFinePayed', {
            privateKey: privateKey,
            databaseType: 'testing',
            clubId: clubId.guidString,
            verbose: true,
            fineId: fineId.guidString,
            updatablePayedState: {
                state: 'payed',
                payDate: '2011-10-14T10:42:38+0000',
                inApp: false,
                updateProperties: {
                    timestamp: '2011-10-15T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });

        // Check fine payed
        const fineList = await getDatabaseFines(clubId, logger.nextIndent);
        const fetchedFine = fineList.find(fine => fine.property.id.equals(fineId))?.property as Fine;
        expect(fetchedFine).to.be.an.instanceOf(Fine);
        expect(fetchedFine?.payedState.databaseObject).to.deep.equal({
            state: 'payed',
            payDate: '2011-10-14T10:42:38.000Z',
            inApp: false,
            updateProperties: {
                timestamp: '2011-10-15T10:42:38.000Z',
                personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        });

        // Check statistic
        const statisticsList =
            await getDatabaseStatisticsPropertyWithIdentifier(clubId, 'changeFinePayed', logger.nextIndent);
        expect(statisticsList.length).to.be.equal(1);
        expect(statisticsList[0]).to.be.deep.equal({
            changedState: {
                inApp: false,
                payDate: '2011-10-14T10:42:38.000Z',
                state: 'payed',
            },
            previousFine: {
                date: '2011-10-14T10:42:38.000Z',
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
                fineReason: {
                    amount: 12.98,
                    id: '9D0681F0-2045-4A1D-ABBC-6BB289934FF9',
                    importance: 'low',
                    reasonMessage: 'asldkfj',
                },
            },
        });
    });

    it('Change fine payed to payed 2', async () => {

        // Add fines and reason
        await addFinesAndReason();

        // Change fine payed
        const fineId = guid.fromString('137d6187-68d2-4000-9cb8-7dfc3877d5ba', logger.nextIndent);
        await callFunction('changeFinePayed', {
            privateKey: privateKey,
            databaseType: 'testing',
            clubId: clubId.guidString,
            fineId: fineId.guidString,
            updatablePayedState: {
                state: 'payed',
                payDate: '2011-10-14T10:42:38+0000',
                inApp: true,
                updateProperties: {
                    timestamp: '2011-10-15T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });

        // Check fine payed
        const fineList = await getDatabaseFines(clubId, logger.nextIndent);
        const fetchedFine = fineList.find(fine => fine.property.id.equals(fineId))?.property as Fine;
        expect(fetchedFine).to.be.an.instanceOf(Fine);
        expect(fetchedFine?.payedState.databaseObject).to.deep.equal({
            state: 'payed',
            payDate: '2011-10-14T10:42:38.000Z',
            inApp: true,
            updateProperties: {
                timestamp: '2011-10-15T10:42:38.000Z',
                personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        });

        // Check statistic
        expect(await getDatabaseStatisticsPropertyWithIdentifier(clubId, 'changeFinePayed', logger.nextIndent))
            .to.be.deep.equal([{
                changedState: {
                    state: 'payed',
                    payDate: '2011-10-14T10:42:38.000Z',
                    inApp: true,
                },
                previousFine: {
                    date: '2011-10-14T10:42:38.000Z',
                    id: '137D6187-68D2-4000-9CB8-7DFC3877D5BA',
                    number: 10,
                    payedState: {
                        inApp: false,
                        payDate: '2011-10-14T10:42:38.000Z',
                        state: 'payed',
                    },
                    person: {
                        id: 'D1852AC0-A0E2-4091-AC7E-CB2C23F708D9',
                        name: {
                            first: 'John',
                            last: 'Doe',
                        },
                    },
                    fineReason: {
                        amount: 1.50,
                        importance: 'high',
                        reasonMessage: 'Reason',
                    },
                },
            }]);
    });

    it('Change fine payed to unpayed', async () => {

        // Add fines and reason
        await addFinesAndReason();

        // Change fine payed
        const fineId = guid.fromString('137d6187-68d2-4000-9cb8-7dfc3877d5ba', logger.nextIndent);
        await callFunction('changeFinePayed', {
            privateKey: privateKey,
            databaseType: 'testing',
            clubId: clubId.guidString,
            fineId: fineId.guidString,
            updatablePayedState: {
                state: 'unpayed',
                updateProperties: {
                    timestamp: '2011-10-15T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });

        // Check fine payed
        const fineList = await getDatabaseFines(clubId, logger.nextIndent);
        const fetchedFine = fineList.find(fine => fine.property.id.equals(fineId))?.property as Fine;
        expect(fetchedFine).to.be.an.instanceOf(Fine);
        expect(fetchedFine?.payedState.databaseObject).to.deep.equal({
            state: 'unpayed',
            inApp: null,
            payDate: null,
            updateProperties: {
                timestamp: '2011-10-15T10:42:38.000Z',
                personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        });

        // Check statistic
        expect(await getDatabaseStatisticsPropertyWithIdentifier(clubId, 'changeFinePayed', logger.nextIndent))
            .to.be.deep.equal([{
                changedState: {
                    state: 'unpayed',
                },
                previousFine: {
                    date: '2011-10-14T10:42:38.000Z',
                    id: '137D6187-68D2-4000-9CB8-7DFC3877D5BA',
                    number: 10,
                    payedState: {
                        inApp: false,
                        payDate: '2011-10-14T10:42:38.000Z',
                        state: 'payed',
                    },
                    person: {
                        id: 'D1852AC0-A0E2-4091-AC7E-CB2C23F708D9',
                        name: {
                            first: 'John',
                            last: 'Doe',
                        },
                    },
                    fineReason: {
                        amount: 1.50,
                        importance: 'high',
                        reasonMessage: 'Reason',
                    },
                },
            }]);
    });

    it('Change fine payed to settled', async () => {

        // Add fines and reason
        await addFinesAndReason();

        // Change fine payed
        const fineId = guid.fromString('137d6187-68d2-4000-9cb8-7dfc3877d5ba', logger.nextIndent);
        await callFunction('changeFinePayed', {
            privateKey: privateKey,
            databaseType: 'testing',
            clubId: clubId.guidString,
            fineId: fineId.guidString,
            updatablePayedState: {
                state: 'settled',
                updateProperties: {
                    timestamp: '2011-10-15T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });

        // Check fine payed
        const fineList = await getDatabaseFines(clubId, logger.nextIndent);
        const fetchedFine = fineList.find(fine => fine.property.id.equals(fineId))?.property as Fine;
        expect(fetchedFine).to.be.an.instanceOf(Fine);
        expect(fetchedFine?.payedState.databaseObject).to.deep.equal({
            state: 'settled',
            inApp: null,
            payDate: null,
            updateProperties: {
                timestamp: '2011-10-15T10:42:38.000Z',
                personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        });

        // Check statistic
        expect(await getDatabaseStatisticsPropertyWithIdentifier(clubId, 'changeFinePayed', logger.nextIndent))
            .to.be.deep.equal([{
                changedState: {
                    state: 'settled',
                },
                previousFine: {
                    date: '2011-10-14T10:42:38.000Z',
                    id: '137D6187-68D2-4000-9CB8-7DFC3877D5BA',
                    number: 10,
                    payedState: {
                        inApp: false,
                        payDate: '2011-10-14T10:42:38.000Z',
                        state: 'payed',
                    },
                    person: {
                        id: 'D1852AC0-A0E2-4091-AC7E-CB2C23F708D9',
                        name: {
                            first: 'John',
                            last: 'Doe',
                        },
                    },
                    fineReason: {
                        amount: 1.50,
                        importance: 'high',
                        reasonMessage: 'Reason',
                    },
                },
            }]);
    });

    it('Change state of deleted fine', async () => {

        // Add fines and reason
        await addFinesAndReason();

        // Delete fine
        const fineId = guid.fromString('137d6187-68d2-4000-9cb8-7dfc3877d5ba', logger.nextIndent);
        await callFunction('changeFine', {
            privateKey: privateKey,
            databaseType: 'testing',
            clubId: clubId.guidString,
            changeType: 'delete',
            fine: {
                id: fineId.guidString,
                deleted: true,
                updateProperties: {
                    timestamp: '2011-10-15T10:42:38+0000',
                    personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                },
            },
        });

        // Check if fine is deleted
        const fineList = await getDatabaseFines(clubId, logger.nextIndent);
        const fetchedFine = fineList.find(fine => fine.property.id.equals(fineId));
        expect(fetchedFine?.databaseObject).to.be.deep.equal({
            deleted: true,
            updateProperties: {
                timestamp: '2011-10-15T10:42:38.000Z',
                personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        });

        // Change fine payed
        try {
            await callFunction('changeFinePayed', {
                privateKey: privateKey,
                databaseType: 'testing',
                clubId: clubId.guidString,
                fineId: fineId.guidString,
                updatablePayedState: {
                    state: 'settled',
                    updateProperties: {
                        timestamp: '2011-10-15T10:42:38+0000',
                        personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                    },
                },
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/internal',
                message: 'Couldn\'t get statistic fine from \'Deleted\'.',
            });
        }
    });
});
