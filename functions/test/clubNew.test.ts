import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { firebaseApp, cleanUpFirebase } from './firebaseApp';
import { testUser } from './privateKeys';
import { Crypter, UtcDate } from 'firebase-function';
import { assert } from 'chai';
import { DatabaseScheme } from '../src/DatabaseScheme';

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
                paypalMeLink: 'paypal.me/asdf'
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
        delete (databaseValue.clubs[clubId.guidString] as { paypalMeLink?: unknown }).paypalMeLink;
        expect(Object.values(databaseValue.clubs[clubId.guidString].persons).length).to.be.equal(1);
        databaseValue.clubs[clubId.guidString].persons = {};
        expect(Object.values(databaseValue.clubs[clubId.guidString].changes.persons).length).to.be.equal(1);
        expect(UtcDate.decode(databaseValue.clubs[clubId.guidString].changes.persons[personId.guidString].slice(0, 16)).setted({ hour: 0, minute: 0 })).to.be.deep.equal(UtcDate.now.setted({ hour: 0, minute: 0 }));
        databaseValue.clubs[clubId.guidString].changes.persons = {};
        expect(Object.values(databaseValue.users).length).to.be.equal(1);
        databaseValue.users = {};
        expect('invitationLinks' in databaseValue).to.be.equal(false);
        databaseValue.invitationLinks = {};
        databaseValue.version = '0.0.0';
        expect(databaseValue).to.be.deep.equal({
            version: '0.0.0',
            users: {},
            invitationLinks: {},
            clubs: {
                [clubId.guidString]: {
                    name: 'Test Club',
                    authentication: {
                        clubMember: {
                            [hashedUserId]: 'authenticated'
                        },
                        clubManager: {
                            [hashedUserId]: 'authenticated'
                        }
                    },
                    persons: {},
                    changes: {
                        persons: {}
                    }
                } as DatabaseScheme['clubs'][string]
            }
        });
        const databasePaypalMeLink = await firebaseApp.database.child('clubs').child(clubId.guidString).child('paypalMeLink').get('decrypt');
        expect(databasePaypalMeLink).to.be.equal('paypal.me/asdf');
        const databasePerson = await firebaseApp.database.child('clubs').child(clubId.guidString).child('persons').child(personId.guidString).get('decrypt');
        assert(databasePerson.signInData !== null);
        expect(databasePerson).to.be.deep.equal({
            name: { first: 'asdf', last: null },
            fineIds: [],
            signInData: {
                hashedUserId: hashedUserId,
                signInDate: databasePerson.signInData.signInDate,
                authentication: ['clubMember', 'clubManager'],
                notificationTokens: {}
            },
            invitationLinkId: null
        });
        const databaseUser = await firebaseApp.database.child('users').child(hashedUserId).get('decrypt');
        expect(databaseUser).to.be.deep.equal({
            clubId: clubId.guidString,
            personId: personId.guidString
        });
    });

    it('existings id', async () => {
        const result1 = await firebaseApp.functions.function('club').function('new').call({
            clubId: clubId.guidString,
            clubProperties: {
                name: 'Test Club',
                paypalMeLink: null
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
                paypalMeLink: null
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
});
