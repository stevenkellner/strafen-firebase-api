import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';
import { Fine } from '../src/TypeDefinitions/Fine';
import { guid } from '../src/TypeDefinitions/guid';
import { ReasonTemplate } from '../src/TypeDefinitions/ReasonTemplate';
import { Person } from '../src/TypeDefinitions/Person';
import { Logger } from '../src/Logger';
import { Deleted } from '../src/utils';
import { Updatable } from '../src/TypeDefinitions/UpdateProperties';

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'europe-west1');
const database = getDatabase(app, 'https://strafen-project-tests.europe-west1.firebasedatabase.app/');
export const auth = getAuth();

/**
 * Call a firebase function.
 * @param { string } functionName Name of the function.
 * @param { any | null } parameters Parameters of the function.
 * @return { Promise<HttpsCallableResult<unknown>> } Returned result of the function.
 */
export async function callFunction(
    functionName: string,
    parameters: any | null
): Promise<HttpsCallableResult<unknown>> {
    return await httpsCallable(functions, functionName)(parameters);
}

/**
 * Signs a user with specified email and password in.
 * @param { string } email Email of user to sign in.
 * @param { string } password Password of the user to sign in.
 * @return { Promise<UserCredential> } Credentials of signed in user.
 */
export async function signIn(email: string, password: string): Promise<UserCredential> {
    return await signInWithEmailAndPassword(auth, email, password);
}

/**
 * Signs in test user.
 * @return { Promise<UserCredential> } Credentials of signed in user.
 */
export async function signInTestUser(): Promise<UserCredential> {
    return await signIn('functions-tests-user@mail.com', 'ghQshXA7rnDdGWj8GffSQN7VGrm9Qf3Z');
}

/**
 * Gets a optional value from database at specified path.
 * @param { string } referencePath Path to get value from.
 * @return { Promise<any | null> } Database value at specified path.
 */
export async function getDatabaseOptionalValue(referencePath: string): Promise<any | null> {
    const reference = ref(database, referencePath);
    return new Promise(resolve => {
        onValue(reference, snapshot => {
            if (!snapshot.exists())
                return resolve(null);
            resolve(snapshot.val());
        });
    });
}

/**
 * Gets a value from database at specified path.
 * @param { string } referencePath Path to get value from.
 * @return { Promise<any> } Database value at specified path.
 */
export async function getDatabaseValue(referencePath: string): Promise<any> {
    const reference = ref(database, referencePath);
    return new Promise((resolve, reject) => {
        onValue(reference, snapshot => {
            if (!snapshot.exists())
                return reject(new Error(`No data exists at path: ${referencePath}`));
            resolve(snapshot.val());
        });
    });
}

/**
 * Get all fines from database in specified club.
 * @param { guid } clubId Id of club to get fines from.
 * @param { Logger } logger Logger to log this method.
 * @return { Promise<Updatable<Fine | Deleted<guid>>[]> } All fines from database in specifid club.
 */
export async function getDatabaseFines(clubId: guid, logger: Logger): Promise<Updatable<Fine | Deleted<guid>>[]> {
    logger.append('getDatabaseFines', { clubId });
    return Object.entries(await getDatabaseValue(`${clubId.guidString}/fines`)).map(value => {
        return Updatable.fromRawProperty({
            id: value[0],
            ...(value[1] as any),
        }, Fine.fromObject, logger.nextIndent);
    });
}

/**
 * Get all reason templates from database in specified club.
 * @param { guid } clubId Id of club to get reason templates from.
 * @param { Logger } logger Logger to log this method.
 * @return { Promise<Updatable<ReasonTemplate | Deleted<guid>>[]> } All reason templates from database in specifid club.
 */
export async function getDatabaseReasonTemplates(clubId: guid, logger: Logger):
    Promise<Updatable<ReasonTemplate | Deleted<guid>>[]> {
    logger.append('getDatabaseReasonTemplates', { clubId });
    return Object.entries(await getDatabaseValue(`${clubId.guidString}/reasonTemplates`)).map(value => {
        return Updatable.fromRawProperty({
            id: value[0],
            ...(value[1] as any),
        }, ReasonTemplate.fromObject, logger.nextIndent);
    });
}

/**
 * Get all persons from database in specified club.
 * @param { guid } clubId Id of club to get persons from.
 * @param { Logger } logger Logger to log this method.
 * @return { Promise<Updatable<Person | Deleted<guid>>[]> } All persons from database in specifid club.
 */
export async function getDatabasePersons(clubId: guid, logger: Logger): Promise<Updatable<Person | Deleted<guid>>[]> {
    logger.append('getDatabasePersons', { clubId });
    return Object.entries(await getDatabaseValue(`${clubId.guidString}/persons`)).map(value => {
        return Updatable.fromRawProperty({
            id: value[0],
            ...(value[1] as any),
        }, Person.fromObject, logger.nextIndent);
    });
}

/**
 * Get all statistics from database in specified club.
 * @param { guid } clubId Id of club to get statistics from.
 * @param { Logger } logger Logger to log this method.
 * @return { Promise<{id: guid, identifier: string, timestamp: number, property: any}[]> } All statistics from
 * database in specifid club.
 */
export async function getDatabaseStatistics(clubId: guid, logger: Logger):
    Promise<{ id: guid, identifier: string, timestamp: number, property: any }[]> {
    logger.append('getDatabaseStatistics', { clubId });
    return Object.entries(await getDatabaseValue(`${clubId.guidString}/statistics`)).map(value => {
        return {
            id: guid.fromString(value[0], logger.nextIndent),
            identifier: (value[1] as any).identifier,
            timestamp: (value[1] as any).timestamp,
            property: (value[1] as any).property,
        };
    });
}

/**
 * Get all statistics form database in specified club with specified identifier.
 * @param { guid } clubId Id of club to get statistics from.
 * @param { string } identifier Identifier of statistics to get.
 * @param { Logger } logger Logger to log this method.
 * @return { Promise<any[]> } All statistics from database in specifid club with specified identifier.
 */
export async function getDatabaseStatisticsPropertyWithIdentifier(clubId: guid, identifier: string, logger: Logger):
    Promise<any[]> {
    return (await getDatabaseStatistics(clubId, logger))
        .filter(statistic => statistic.identifier == identifier)
        .map(statistic => statistic.property);
}

/**
 * Error code and message of a firebase error.
 */
interface ErrorCodeAndMessage {

    /**
     * Error code of a firebase error.
     */
    code: string,

    /**
     * Error message of a firebase error.
     */
    message: string,
}

/**
 * Converts error to firebase error code and message.
 * @param { unknown } error Error to convert to firebase error code and message.
 * @return { ErrorCodeAndMessage } Firebase error code and message.
 */
export function firebaseError(error: unknown): ErrorCodeAndMessage {
    const _errorCodeAndMessage = errorCodeAndMessage(error);
    if ((error as any).hasOwnProperty('name') && (error as any).name == 'FirebaseError')
        return _errorCodeAndMessage;
    throw error;
}

/**
 * Converts error to firebase error code and message.
 * @param { unknown } error Error to convert to firebase error code and message.
 * @return { ErrorCodeAndMessage } Firebase error code and message.
 */
export function errorCodeAndMessage(error: unknown): ErrorCodeAndMessage {
    if (typeof error == 'object' && (error as any).hasOwnProperty('code') && (error as any).hasOwnProperty('message'))
        return {
            code: (error as any).code,
            message: (error as any).message,
        };
    throw error;
}
