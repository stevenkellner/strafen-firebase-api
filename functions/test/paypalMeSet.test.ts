import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { createTestClub, authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';

describe('paypalMeSet', () => {
    const clubId = Guid.newGuid();

    beforeEach(async () => {
        await createTestClub(clubId);
        await authenticateTestUser(clubId);
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('set paypal me', async () => {
        expect(await firebaseApp.database.child('clubs').child(clubId.guidString).child('paypalMeLink').get('decrypt')).to.be.equal('paypal.me/test');
        const result1 = await firebaseApp.functions.function('paypalMe').function('set').call({
            clubId: clubId.guidString,
            paypalMeLink: 'paypal.me/asdf'
        });
        result1.success;
        expect(await firebaseApp.database.child('clubs').child(clubId.guidString).child('paypalMeLink').get('decrypt')).to.be.equal('paypal.me/asdf');
        const result2 = await firebaseApp.functions.function('paypalMe').function('set').call({
            clubId: clubId.guidString,
            paypalMeLink: null
        });
        result2.success;
        expect(await firebaseApp.database.child('clubs').child(clubId.guidString).child('paypalMeLink').get('decrypt')).to.be.equal(null);
        const result3 = await firebaseApp.functions.function('paypalMe').function('set').call({
            clubId: clubId.guidString,
            paypalMeLink: null
        });
        result3.success;
        expect(await firebaseApp.database.child('clubs').child(clubId.guidString).child('paypalMeLink').get('decrypt')).to.be.equal(null);
        const result4 = await firebaseApp.functions.function('paypalMe').function('set').call({
            clubId: clubId.guidString,
            paypalMeLink: 'paypal.me/lknjbhj'
        });
        result4.success;
        expect(await firebaseApp.database.child('clubs').child(clubId.guidString).child('paypalMeLink').get('decrypt')).to.be.equal('paypal.me/lknjbhj');
    });
});
