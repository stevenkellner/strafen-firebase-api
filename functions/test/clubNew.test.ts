import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { firebaseApp, cleanUpFirebase } from './firebaseApp';
import { testUser } from './privateKeys';
import { Crypter } from 'firebase-function';
import { assert } from 'chai';

describe('clubNew', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await firebaseApp.auth.signIn(testUser.email, testUser.password);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('create new club', async () => {
        const personId = Guid.newGuid();
        const result = await firebaseApp.functions.function('club').function('new').call({
            clubId: clubId.guidString,
            clubProperties: {
                name: 'Test Club',
                identifier: 'test-club',
                regionCode: 'DE',
                inAppPaymentActive: false
            },
            personId: personId.guidString,
            personName: {
                first: 'asdf',
                last: null
            }
        });
        result.success;
        assert(firebaseApp.auth.currentUser !== null);
        const hashedUserId = Crypter.sha512(firebaseApp.auth.currentUser.uid);
        const databaseValue = await firebaseApp.database.get();
        expect(Object.values(databaseValue.clubs[clubId.guidString].persons).length).to.be.equal(1);
        databaseValue.clubs[clubId.guidString].persons = {};
        expect(databaseValue).to.be.deep.equal({
            clubIdentifiers: {
                'test-club': clubId.guidString
            },
            users: {
                [hashedUserId]: {
                    clubId: clubId.guidString,
                    personId: personId.guidString
                }
            },
            clubs: {
                [clubId.guidString]: {
                    name: 'Test Club',
                    identifier: 'test-club',
                    regionCode: 'DE',
                    inAppPaymentActive: false,
                    authentication: {
                        clubMember: {
                            [hashedUserId]: 'authenticated'
                        },
                        clubManager: {
                            [hashedUserId]: 'authenticated'
                        }
                    },
                    persons: {}
                } as never
            }
        });
        const databasePerson = await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child(personId.guidString).get('decrypt');
        assert(databasePerson.signInData !== null);
        expect(databasePerson).to.be.deep.equal({
            name: { first: 'asdf', last: null },
            fineIds: [],
            signInData: { hashedUserId: hashedUserId, signInDate: databasePerson.signInData.signInDate }
        });
    });

    it('existings id', async () => {
        const result1 = await firebaseApp.functions.function('club').function('new').call({
            clubId: clubId.guidString,
            clubProperties: {
                name: 'Test Club',
                identifier: 'test-club-1',
                regionCode: 'DE',
                inAppPaymentActive: false
            },
            personId: Guid.newGuid().guidString,
            personName: {
                first: 'asdf',
                last: null
            }
        });
        result1.success;
        const result2 = await firebaseApp.functions.function('club').function('new').call({
            clubId: clubId.guidString,
            clubProperties: {
                name: 'Test Club',
                identifier: 'test-club-2',
                regionCode: 'DE',
                inAppPaymentActive: false
            },
            personId: Guid.newGuid().guidString,
            personName: {
                first: 'asdf',
                last: null
            }
        });
        result2.failure.equal({
            code: 'already-exists',
            message: 'Club with specified id already exists.'
        });
    });

    it('existings identifier', async () => {
        const result1 = await firebaseApp.functions.function('club').function('new').call({
            clubId: Guid.newGuid().guidString,
            clubProperties: {
                name: 'Test Club',
                identifier: 'test-club',
                regionCode: 'DE',
                inAppPaymentActive: false
            },
            personId: Guid.newGuid().guidString,
            personName: {
                first: 'asdf',
                last: null
            }
        });
        result1.success;
        const result2 = await firebaseApp.functions.function('club').function('new').call({
            clubId: clubId.guidString,
            clubProperties: {
                name: 'Test Club',
                identifier: 'test-club',
                regionCode: 'DE',
                inAppPaymentActive: false
            },
            personId: Guid.newGuid().guidString,
            personName: {
                first: 'asdf',
                last: null
            }
        });
        result2.failure.equal({
            code: 'already-exists',
            message: 'Club identifier already exists.'
        });
    });
});
