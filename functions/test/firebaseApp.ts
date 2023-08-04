import { Crypter } from 'firebase-function';
import { FirebaseApp } from 'firebase-function/lib/src/testUtils';
import { type DatabaseScheme } from '../src/DatabaseScheme';
// import { type firebaseFunctions } from '../src/functions/firebaseFunctions';
import { type firebaseFunctions as debugFirebaseFunctions } from '../src/firebaseFunctions';
import { type UserAuthenticationType } from '../src/types/UserAuthentication';
import { callSecretKey, cryptionKeys, firebaseConfig, testUser } from './privateKeys';
import { type Guid } from '../src/types/Guid';
import { type TestClubType } from '../src/types/TestClubType';

export const firebaseApp = new FirebaseApp<typeof debugFirebaseFunctions, DatabaseScheme>(firebaseConfig, cryptionKeys, callSecretKey, {
    functionsRegion: 'europe-west1',
    databaseUrl: firebaseConfig.databaseURL
});

export async function createTestClub(clubId: Guid, testClubType: TestClubType = 'default') {
    const result = await firebaseApp.functions.function('club').function('newTest').call({
        clubId: clubId.guidString,
        testClubType: testClubType
    });
    result.success;
}

export async function authenticateTestUser(clubId: Guid) {
    if (firebaseApp.auth.currentUser === null)
        await firebaseApp.auth.signIn(testUser.email, testUser.password);
    const authenticationTypes: UserAuthenticationType[] = ['clubMember', 'clubManager'];
    await Promise.all(authenticationTypes.map(async authenticationType => await authenticateUser(authenticationType, clubId)));
}

async function authenticateUser(authenticationType: UserAuthenticationType, clubId: Guid) {
    const hashedUserId = Crypter.sha512(firebaseApp.auth.currentUser!.uid); // eslint-disable-line @typescript-eslint/no-non-null-assertion
    await firebaseApp.database.child('clubs').child(clubId.guidString).child('authentication').child(authenticationType).child(hashedUserId).set('authenticated');
}

export async function cleanUpFirebase() {
    const result = await firebaseApp.functions.function('deleteAllData').call({});
    result.success;
}
