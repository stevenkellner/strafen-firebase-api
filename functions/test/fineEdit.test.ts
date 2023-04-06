import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';

describe('fineEdit', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('delete not existing', async () => {
        const fineId = Guid.newGuid();
        const result = await firebaseApp.functions.function('fine').function('edit').call({
            clubId: clubId.guidString,
            editType: 'delete',
            fineId: fineId.guidString,
            fine: undefined
        });
        result.success;
    });

    it('delete existing', async () => {
        const fineId = new Guid('02462A8B-107F-4BAE-A85B-EFF1F727C00F');
        const result = await firebaseApp.functions.function('fine').function('edit').call({
            clubId: clubId.guidString,
            editType: 'delete',
            fineId: fineId.guidString,
            fine: undefined
        });
        result.success;
        expect(await firebaseApp.database.child('clubs').child(clubId.guidString).child('fines').child(fineId.guidString).exists()).to.be.equal(false);
    });

    it('add not given over', async () => {
        const fineId = Guid.newGuid();
        const result = await firebaseApp.functions.function('fine').function('edit').call({
            clubId: clubId.guidString,
            editType: 'add',
            fineId: fineId.guidString,
            fine: undefined
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'No fine in parameters to add / update.'
        });
    });

    it('add not existing', async () => {
        const fineId = Guid.newGuid();
        const result = await firebaseApp.functions.function('fine').function('edit').call({
            clubId: clubId.guidString,
            editType: 'add',
            fineId: fineId.guidString,
            fine: {
                personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                date: '2023-02-20T17:23:45.678+01:00',
                number: 3,
                payedState: {
                    state: 'unpayed'
                },
                fineReason: {
                    reasonMessage: 'test-message-1',
                    amount: 9.50,
                    importance: 'high'
                }
            }
        });
        result.success;
        const databasefine = await firebaseApp.database.child('clubs').child(clubId.guidString).child('fines').child(fineId.guidString).get('decrypt');
        expect(databasefine).to.be.deep.equal({
            personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            date: '2023-02-20T16:23:45.678Z',
            number: 3,
            payedState: {
                state: 'unpayed'
            },
            fineReason: {
                reasonMessage: 'test-message-1',
                amount: 9.50,
                importance: 'high'
            }
        });
    });

    it('add existing', async () => {
        const fineId = new Guid('02462A8B-107F-4BAE-A85B-EFF1F727C00F');
        const result = await firebaseApp.functions.function('fine').function('edit').call({
            clubId: clubId.guidString,
            editType: 'add',
            fineId: fineId.guidString,
            fine: {
                personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                date: '2023-02-20T17:23:45.678+01:00',
                number: 3,
                payedState: {
                    state: 'unpayed'
                },
                fineReason: {
                    reasonMessage: 'test-message-1',
                    amount: 9.50,
                    importance: 'high'
                }
            }
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t add existing fine.'
        });
    });

    it('update not given over', async () => {
        const fineId = Guid.newGuid();
        const result = await firebaseApp.functions.function('fine').function('edit').call({
            clubId: clubId.guidString,
            editType: 'update',
            fineId: fineId.guidString,
            fine: undefined
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'No fine in parameters to add / update.'
        });
    });

    it('update not existing', async () => {
        const fineId = Guid.newGuid();
        const result = await firebaseApp.functions.function('fine').function('edit').call({
            clubId: clubId.guidString,
            editType: 'update',
            fineId: fineId.guidString,
            fine: {
                personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                date: '2023-02-20T17:23:45.678+01:00',
                number: 3,
                payedState: {
                    state: 'unpayed'
                },
                fineReason: {
                    reasonMessage: 'test-message-1',
                    amount: 9.50,
                    importance: 'high'
                }
            }
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t update not existing fine.'
        });
    });

    it('update existing', async () => {
        const fineId = new Guid('02462A8B-107F-4BAE-A85B-EFF1F727C00F');
        const result = await firebaseApp.functions.function('fine').function('edit').call({
            clubId: clubId.guidString,
            editType: 'update',
            fineId: fineId.guidString,
            fine: {
                personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                date: '2023-02-20T17:23:45.678+01:00',
                number: 3,
                payedState: {
                    state: 'unpayed'
                },
                fineReason: {
                    reasonMessage: 'test-message-1',
                    amount: 9.50,
                    importance: 'high'
                }
            }
        });
        result.success;
        const databasefine = await firebaseApp.database.child('clubs').child(clubId.guidString).child('fines').child(fineId.guidString).get('decrypt');
        expect(databasefine).to.be.deep.equal({
            personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            date: '2023-02-20T16:23:45.678Z',
            number: 3,
            payedState: {
                state: 'unpayed'
            },
            fineReason: {
                reasonMessage: 'test-message-1',
                amount: 9.50,
                importance: 'high'
            }
        });
    });
});