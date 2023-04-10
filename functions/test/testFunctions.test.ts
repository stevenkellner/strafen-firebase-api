import { expect } from 'firebase-function/lib/src/testUtils';
import { firebaseApp } from './firebaseApp';
import { Guid } from '../src/types/Guid';

describe('testFunctions', () => {
    const clubId = Guid.newGuid();

    it('delete all data | no data', async () => {
        const result = await firebaseApp.functions.function('deleteAllData').call({});
        result.success;
        expect(await firebaseApp.database.exists()).to.be.equal(false);
    });

    it('delete all data | with data', async () => {
        await firebaseApp.database.child('clubs').child('asdf').child('name').set('ölkj');
        expect(await firebaseApp.database.exists()).to.be.equal(true);
        const result = await firebaseApp.functions.function('deleteAllData').call({});
        result.success;
        expect(await firebaseApp.database.exists()).to.be.equal(false);
    });

    it('new test club | default', async () => {
        const result = await firebaseApp.functions.function('club').function('newTest').call({
            clubId: clubId.guidString,
            testClubType: 'default'
        });
        result.success;
        await firebaseApp.functions.function('deleteAllData').call({});
    });
});
