import { type DatabaseType, HttpsError, type ILogger, DatabaseReference, Crypter } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { type DatabaseScheme } from './DatabaseScheme';
import { getPrivateKeys } from './privateKeys';
import { type Guid } from './types/Guid';
import { type UserAuthenticationType } from './types/UserAuthentication';

export async function checkUserAuthentication(
    auth: AuthData | undefined,
    clubId: Guid,
    authenticationTypes: UserAuthenticationType | UserAuthenticationType[],
    databaseType: DatabaseType,
    logger: ILogger
): Promise<string> {
    logger.log('checkUserAuthentication', { auth: auth, authenticationTypes: authenticationTypes, databaseType: databaseType });
    if (auth === undefined)
        throw HttpsError('permission-denied', 'The function must be called while authenticated, nobody signed in.', logger);
    if (typeof authenticationTypes === 'string') {
        await checkSingleUserAuthenticationType(auth, clubId, authenticationTypes, databaseType, logger.nextIndent);
    } else {
        await Promise.all(authenticationTypes.map(async authenticationType => await checkSingleUserAuthenticationType(auth, clubId, authenticationType, databaseType, logger.nextIndent)));
    }
    return Crypter.sha512(auth.uid);
}

async function checkSingleUserAuthenticationType(
    auth: AuthData,
    clubId: Guid,
    authenticationType: UserAuthenticationType,
    databaseType: DatabaseType,
    logger: ILogger
) {
    logger.log('checkSingleUserAuthenticationType', { auth: auth, authenticationType: authenticationType, databaseType: databaseType });
    const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(databaseType)).child('clubs').child(clubId.guidString).child('authentication').child(authenticationType).child(Crypter.sha512(auth.uid));
    const snapshot = await reference.snapshot();
    if (!snapshot.exists || snapshot.value() !== 'authenticated')
        throw HttpsError('permission-denied', `The function must be called while authenticated, not authenticated for ${authenticationType}.`, logger);
}
