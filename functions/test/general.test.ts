import { signOut } from '@firebase/auth';
import { expect, assert } from 'chai';
import { privateKey } from '../src/privateKeys';
import { guid } from '../src/TypeDefinitions/guid';
import { Logger } from '../src/TypeDefinitions/LoggingProperties';
import { ParameterContainer } from '../src/TypeDefinitions/ParameterContainer';
import { callFunction, signInTestUser, auth, firebaseError } from './utils';

describe('General', () => {

    const loggingProperties = Logger.withFirst(new ParameterContainer({ verbose: true }), 'generalTest', undefined, 'notice');

    beforeEach(async () => {
        if (auth.currentUser != null)
            await signOut(auth);
    });

    it('No parameters', async () => {
        try {
            await callFunction('changeFinePayed', null);
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse \'verbose\'. No parameters specified to this function.',
            });
        }
    });

    it('No private key', async () => {
        try {
            await callFunction('changeFinePayed', {});
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/invalid-argument',
                message: 'Couldn\'t parse \'privateKey\'. Expected type \'string\', but got undefined or null.',
            });
        }
    });

    it('Invalid club level', async () => {
        try {
            await callFunction('changeFinePayed', {
                privateKey: 'some key',
                clubLevel: 'invalid level',
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                state: {
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
                message: 'Couldn\'t parse ClubLevel, expected \'regular\', \'debug\' or \'testing\', but got invalid level instead.',
            });
        }
    });

    it('Invalid guid', async () => {
        try {
            await callFunction('changeFinePayed', {
                privateKey: 'some key',
                clubLevel: 'testing',
                clubId: 'invalid guid',
                fineId: guid.newGuid().guidString,
                state: {
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
                message: 'Couldn\'t parse Guid, guid string isn\'t a valid Guid: invalid guid',
            });
        }
    });

    it('Invalid private key', async () => {
        try {
            await callFunction('changeFinePayed', {
                privateKey: 'invalidKey',
                clubLevel: 'testing',
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                state: {
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
                code: 'functions/permission-denied',
                message: 'Private key is invalid.',
            });
        }
    });

    it('No user signed in', async () => {
        try {
            await callFunction('changeFinePayed', {
                privateKey: privateKey,
                clubLevel: 'testing',
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                state: {
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
                code: 'functions/permission-denied',
                message: 'The function must be called while authenticated, nobody signed in.',
            });
        }
    });

    it('User not in club', async () => {
        try {
            await signInTestUser();
            await callFunction('changeFinePayed', {
                privateKey: privateKey,
                clubLevel: 'testing',
                clubId: guid.newGuid().guidString,
                fineId: guid.newGuid().guidString,
                state: {
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
                code: 'functions/permission-denied',
                message: 'The function must be called while authenticated, person not in club.',
            });
        }
    });

    it('Older function value', async () => {
        try {
            const clubId = guid.newGuid();
            const fineId = guid.fromString('1B5F958E-9D7D-46E1-8AEE-F52F4370A95A', loggingProperties.nextIndent);
            await signInTestUser();
            await callFunction('newTestClub', {
                privateKey: privateKey,
                clubLevel: 'testing',
                clubId: clubId.guidString,
                testClubType: 'default',
            });
            await callFunction('changeFinePayed', {
                privateKey: privateKey,
                clubLevel: 'testing',
                clubId: clubId.guidString,
                fineId: fineId.guidString,
                state: {
                    state: 'unpayed',
                    updateProperties: {
                        timestamp: '2011-10-12T10:42:38+0000',
                        personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                    },
                },
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/cancelled',
                message: 'Server value is newer or same old than updated value.',
            });
        }
        await callFunction('deleteTestClubs', {
            privateKey: privateKey,
            clubLevel: 'testing',
        });
        await signOut(auth);
    });

    it('Same old function value', async () => {
        try {
            const clubId = guid.newGuid();
            const fineId = guid.fromString('1B5F958E-9D7D-46E1-8AEE-F52F4370A95A', loggingProperties.nextIndent);
            await signInTestUser();
            await callFunction('newTestClub', {
                privateKey: privateKey,
                clubLevel: 'testing',
                clubId: clubId.guidString,
                testClubType: 'default',
            });
            await callFunction('changeFinePayed', {
                privateKey: privateKey,
                clubLevel: 'testing',
                clubId: clubId.guidString,
                fineId: fineId.guidString,
                state: {
                    state: 'unpayed',
                    updateProperties: {
                        timestamp: '2011-10-13T10:42:38+0000',
                        personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                    },
                },
            });
            assert.fail('A statement above should throw an exception.');
        } catch (error) {
            expect(firebaseError(error)).to.be.deep.equal({
                code: 'functions/cancelled',
                message: 'Server value is newer or same old than updated value.',
            });
        }
        await callFunction('deleteTestClubs', {
            privateKey: privateKey,
            clubLevel: 'testing',
        });
        await signOut(auth);
    });
});
