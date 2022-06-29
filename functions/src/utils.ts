import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { cryptionKeys, functionCallKey } from './privateKeys';
import { guid } from './TypeDefinitions/guid';
import { DatabaseType } from './TypeDefinitions/DatabaseType';
import { Logger } from './Logger';
import { UpdateProperties } from './TypeDefinitions/Updatable';
import { AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { Crypter } from './crypter/Crypter';
import { CanonicalErrorCodeName } from 'firebase-functions/lib/common/providers/https';

/**
 * Checks prerequirements for firebase function:
 *  - Checks if private key is valid.
 *  - Checks if authentication isn't undefined.
 *  - If specified club id isn't undefined, checks if person is in that club.
 * @param { DatabaseType } databaseType Database type.
 * @param { string } privateKey Private key.
 * @param { Logger } logger Logger to log this method.
 * @param { { uid: string } | undefined } auth Authentication state of person called the firebase function.
 * @param { guid | undefined } clubId Id of the club to check if person that challed the firebase function
 * is in that club.
 */
export async function checkPrerequirements(
    databaseType: DatabaseType,
    privateKey: string,
    logger: Logger,
    auth?: AuthData,
    clubId?: guid
) {
    logger.append('checkPrerequirements', { databaseType, auth, clubId });

    // Check if private key is valid.
    if (Crypter.sha512(privateKey) !== functionCallKey(databaseType))
        throw httpsError('permission-denied', 'Private key is invalid.', logger);

    // Check if user is authorized to call a function.
    if (auth === undefined)
        throw httpsError(
            'permission-denied',
            'The function must be called while authenticated, nobody signed in.',
            logger
        );

    // Check if person is sign in to club.
    if (clubId !== undefined) {
        const personUserIdReference = reference(
            `${clubId.guidString}/personUserIds/${auth.uid}`,
            databaseType,
            logger.nextIndent,
        );
        if (!await existsData(personUserIdReference))
            throw httpsError(
                'permission-denied',
                'The function must be called while authenticated, person not in club.',
                logger
            );
    }
}

/**
 * Check the update properties of updated database.
 * @param { string } updatePropertiesPath Path to update properties in the database.
 * @param { UpdateProperties } functionUpdateProperties Update properties of called firebase function.
 * @param { DatabaseType } databaseType Database type to get database reference.
 * @param { Logger } logger Logger to log this method.
 */
export async function checkUpdateProperties(
    updatePropertiesPath: string,
    functionUpdateProperties: UpdateProperties,
    databaseType: DatabaseType,
    logger: Logger
) {
    logger.append('checkUpdateProperties', { updatePropertiesPath, functionUpdateProperties, databaseType });

    // Get server update properties.
    const updatePropertiesReference = reference(
        updatePropertiesPath,
        databaseType,
        logger.nextIndent
    );
    const updatePropertiesSnapshot = await updatePropertiesReference.once('value');
    if (!updatePropertiesSnapshot.exists()) return;
    const serverUpdateProperties = UpdateProperties.fromValue(updatePropertiesSnapshot.val(), logger.nextIndent);

    // Check update properties timestamp.
    if (functionUpdateProperties.timestamp <= serverUpdateProperties.timestamp)
        throw httpsError(
            'cancelled',
            'Server value is newer or same old than updated value.',
            logger
        );
}

/**
 * Checks if data exists at specified reference.
 * @param { admin.database.Reference } reference Reference to check if there is data.
 * @return { Promise<boolean> } True if data exists at reference.
 */
export async function existsData(reference: admin.database.Reference): Promise<boolean> {
    return (await reference.once('value')).exists();
}

/**
 * Get the database reference t0 specified path.
 * @param { string } path Path to get the database reference to.
 * @param { DatabaseType } databaseType Database type.
 * @param { Logger } logger Logger to log this method.
 * @return { admin.database.Reference } Database reference t0 specified path.
 */
export function reference(
    path: string,
    databaseType: DatabaseType,
    logger: Logger,
): admin.database.Reference {
    logger.append('reference', { path, databaseType });

    // Return reference.
    return admin.app().database(databaseType.databaseUrl).ref(path || undefined);
}

/**
 * Returns a function https error with specified code and message.
 * @param { functions.https.FunctionsErrorCode } code Code of the function https error.
 * @param { string } message Message of the function https error.
 * @param { Logger | undefined } logger Logger to get verbose message from.
 * @return { functions.https. } Function https error with specified code and message.
 */
export function httpsError(
    code: functions.https.FunctionsErrorCode,
    message: string,
    logger: Logger | undefined
): functions.https.HttpsError {
    return new functions.https.HttpsError(code, message, logger?.joinedMessages);
}

/**
 * A deleted object that contains an id.
 * @template ID Type of the id.
 */
export class Deleted<ID> {

    /**
     * Constructs a deleted object with an id.
     * @param { ID } id Id of the deleted object.
     */
    public constructor(public readonly id: ID) {}

    /**
     * Object to set into the database.
     */
    public readonly databaseObject = { deleted: true };
}

/**
 * Declares an interface for a firebase function to execute this function.
 * @template Parameters Type of the parameters of this fireabse function.
 * @template ReturnType Type of the return value of this firebase function.
 */
export interface IFirebaseFunction<Parameters, ReturnType> {

    /**
     * Parser to parse firebase function parameters from parameter container.
     */
    parameters: Parameters;

    /**
     * Execute this firebase function.
     * @returns { Promise<ReturnType> } Return value of this firebase function.
     */
    executeFunction(): Promise<ReturnType>;
}

type FirebaseFunctionReturnType<T> = T extends IFirebaseFunction<any, infer ReturnType> ? ReturnType : never;

/**
 * Throws a error if promise is rejected.
 * @template T Type of the promise.
 * @param { Promise<T> } promise Promise to get error from.
 * @return { Promise<T> } Return promise.
 */
function throwRejection<T>(promise: Promise<T>): Promise<T> {
    let error: Error | undefined = undefined;
    const p = promise.catch<Error>(reason => error = reason);
    if (error !== undefined) throw error;
    return p as Promise<T>;
}

interface FirebaseFunctionResultError {
    status: CanonicalErrorCodeName,
    message: string,
    details?: unknown,
    stack?: string,
}

/**
 * Check if specified status is a canonical error code name.
 * @param { string | undefined } status Status to check.
 * @return { boolean } true if status is a canonical error code name, false otherwise.
 */
function isCanonicalErrorCodeName(status: string | undefined): status is CanonicalErrorCodeName {
    if (status === undefined) return false;
    return [
        'OK', 'CANCELLED', 'UNKNOWN', 'INVALID_ARGUMENT', 'DEADLINE_EXCEEDED', 'NOT_FOUND', 'ALREADY_EXISTS',
        'PERMISSION_DENIED', 'UNAUTHENTICATED', 'RESOURCE_EXHAUSTED', 'FAILED_PRECONDITION', 'ABORTED', 'OUT_OF_RANGE',
        'UNIMPLEMENTED', 'INTERNAL', 'UNAVAILABLE', 'DATA_LOSS',
    ].includes(status);
}

/**
 * Convert any error to a firebase function result error.
 * @param { any } error Error to conver.
 * @return { FirebaseFunctionResultError } Converted firebase function result error.
 */
function convertToFunctionResultError(error: any): FirebaseFunctionResultError {
    const hasMessage = error.message !== undefined && error.message !== null && error.message !== '';
    const hasStack = error.stack !== undefined && error.stack !== null && error.stack !== '';
    return {
        status: isCanonicalErrorCodeName(error.status) ? error.status : 'UNKNOWN',
        message: hasMessage ? `${error.message}` : 'Unknown error occured, see details for more infos.',
        details: hasMessage ? error.details : error,
        stack: hasStack !== undefined ? `${error.stack}` : undefined,
    };
}


type FirebaseFunctionResult = {
    state: 'success',
    returnValue: any,
} | {
    state: 'failure',
    error: FirebaseFunctionResultError,
};

// eslint-disable-next-line valid-jsdoc
/**
 * Create a server firebase function.
 * @template FirebaseFunction Type of the firebase function
 * @param { function(data: any, auth: AuthData | undefined): FirebaseFunction } createFirebaseFunction
 * Creates firebase function.
 * @return { functions.HttpsFunction & functions.Runnable<any> } Server firebase function.
 */
export function createFunction<
    FirebaseFunction extends IFirebaseFunction<any, FirebaseFunctionReturnType<FirebaseFunction>>
>(
    createFirebaseFunction: (data: any, auth: AuthData | undefined) => FirebaseFunction
): functions.HttpsFunction & functions.Runnable<any> {
    return functions.region('europe-west1').https.onCall(async (data, context) => {

        // Get database
        const logger = Logger.start(false, 'createFunction', undefined, 'notice');
        const databaseType = DatabaseType.fromValue(data.databaseType, logger.nextIndent);

        // Get result of function call
        let result: FirebaseFunctionResult;
        try {

            // Call firebase function and set result if succeded
            const firebaseFunction = createFirebaseFunction(data, context.auth);
            const returnValue = await throwRejection(firebaseFunction.executeFunction());
            result = {
                state: 'success',
                returnValue: returnValue,
            };
        } catch (error: any) {

            // Set result error.
            result = {
                state: 'failure',
                error: convertToFunctionResultError(error),
            };
        }

        // Encrypt result
        const crypter = new Crypter(cryptionKeys(databaseType));
        return crypter.encodeEncrypt(result);
    });
}

/**
 * Type of snapshot from database reference.
 */
export interface DataSnapshot {

    /**
     * Get child snapshot with specified path.
     * @param { string } path Path to child.
     * @return { DataSnapshot } Snapshot of the child at specified path.
     */
    child(path: string): DataSnapshot;

    /**
     * Indicates whether a value exists in this snapshot.
     * @return { boolean } `true` if a value exists in this snapshot, `false` otherwise.
     */
    exists(): boolean;

    /**
     * Loops through all children of this snapshot.
     * @param { function(a: DataSnapshot): boolean } action Action to execute for each child snapshot.
     * Return `true` if loop should be ended early.
     * @return { boolean } `true` if loop ended early, `false` otherwise.
     */
    forEach(action: (a: DataSnapshot) => boolean | void): boolean;

    /**
     * Indicates whether this snapshot has a child at specified path.
     * @param { string } path Path to check whether a child exists there.
     * @return { boolean } `true` if there exists a child at specified path, `false` otherwise.
     */
    hasChild(path: string): boolean;

    /**
     * Indicates whether this snapshot has children.
     * @return { boolean } `true` if there exists children, `false`otherwise.
     */
    hasChildren(): boolean;

    /**
     * Key of this snapshot.
     */
    key: string | null;

    /**
     * Gets the number of children of this snapshot.
     * @return { number } Number of children of this snapshot.
     */
    numChildren(): number;

    /**
     * Gets the value of this snapshot.
     * @return { any } Value of this snapshot.
     */
    val(): any;
}

/**
 * Encodes unishort buffer to string.
 * @param { buffer } buffer Buffer to encode.
 * @return { string } Encoded string.
 */
export function unishortString(buffer: Buffer): string {
    let string = '';
    for (const byte of buffer) {
        string += String.fromCharCode(byte);
    }
    return string;
}

/**
 * Encodes unishort string to buffer.
 * @param { string } string String to encode.
 * @return { buffer } Encoded buffer.
 */
export function unishortBuffer(string: string): Buffer {
    const bytes: number[] = [];
    for (let index = 0; index < string.length; index++) {
        bytes.push(string.charCodeAt(index));
    }
    return Buffer.from(bytes);
}

/* eslint-disable no-extend-native */
declare global {
    export interface String {

        /**
         * Colors the string red.
         */
        red(): string;

        /**
         * Colors the string green.
         */
        green(): string;

        /**
         * Colors the string yellow.
         */
        yellow(): string;

        /**
         * Colors the string blue.
         */
        blue(): string;

        /**
         * Colors the string magenta.
         */
        magenta(): string;

        /**
         * Colors the string cyan.
         */
        cyan(): string;

        /**
         * Colors the string gray.
         */
        gray(): string;
    }
}

String.prototype.red = function() {
    return `\x1b[31m${this}\x1b[0m`;
};

String.prototype.green = function() {
    return `\x1b[32m${this}\x1b[0m`;
};

String.prototype.yellow = function() {
    return `\x1b[33m${this}\x1b[0m`;
};

String.prototype.blue = function() {
    return `\x1b[34m${this}\x1b[0m`;
};

String.prototype.magenta = function() {
    return `\x1b[35m${this}\x1b[0m`;
};

String.prototype.cyan = function() {
    return `\x1b[36m${this}\x1b[0m`;
};

String.prototype.gray = function() {
    return `\x1b[40m\x1b[2m${this}\x1b[0m`;
};
