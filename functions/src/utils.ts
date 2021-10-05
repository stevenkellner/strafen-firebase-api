import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {privateKey} from "./privateKeys";
import {guid} from "./TypeDefinitions/guid";
import {ClubLevel} from "./TypeDefinitions/ClubLevel";
import {ParameterContainer} from "./TypeDefinitions/ParameterContainer";
import { LoggingProperties } from "./TypeDefinitions/LoggingProperties";

/**
 * Checks prerequirements for firebase function:
 *  - Checks if private key is valid.
 *  - Checks if authentication isn't null.
 *  - If club id isn't null, checks if person is in that club.
 * @param {FunctionDefaultParameters} parameter Parameters needed for this check.
 * @param {{ uid: string } | undefined} auth Authentication state.
 * @param {guid | undefined } clubId Id of club to check if person is in that club.
 */
export async function checkPrerequirements(parameter: FunctionDefaultParameters, loggingProperties?: LoggingProperties, auth?: { uid: string }, clubId?: guid) {
    loggingProperties?.append("checkPrerequirements", {parameter: parameter, auth: auth, clubId: clubId});

    // Check if key is valid
    if (parameter.privateKey != privateKey)
        throw httpsError("permission-denied", "Private key is invalid.", loggingProperties?.nextIndent);

    // Check if user is authorized to call a function
    if (auth == null)
        throw httpsError("permission-denied", "The function must be called while authenticated, nobody signed in.", loggingProperties?.nextIndent);

    // Check if person is sign in to club
    if (clubId != null) {
        const path = `${parameter.clubLevel.getClubComponent()}/${clubId.guidString}/personUserIds/${auth.uid}`;
        const ref = admin.database().ref(path);
        if (!await existsData(ref))
            throw httpsError("permission-denied", "The function must be called while authenticated, person not in club.", loggingProperties?.nextIndent);
    }
}

export async function checkUpdateTimestamp(updatePropertiesPath: string, functionUpdateProperties: UpdateProperties, loggingProperties?: LoggingProperties) {
    loggingProperties?.append("checkUpdateTimestamp", {updatePropertiesPath: updatePropertiesPath, functionUpdateProperties: functionUpdateProperties});

    // Get server update properties
    const updatePropertiesRef = admin.database().ref(updatePropertiesPath);
    const snapshot = await updatePropertiesRef.once("value");
    if (!snapshot.exists()) return;
    const serverUpdateProperties = UpdateProperties.fromObject(snapshot.val(), loggingProperties?.nextIndent);

    // Check timestamp
    if (functionUpdateProperties.timestamp <= serverUpdateProperties.timestamp)
        throw httpsError("cancelled", "Server value is newer or same old than updated value.", loggingProperties?.nextIndent);
}

/**
 * Checks if data exists at specified reference.
 * @param {admin.database.Reference} reference Reference to check if there is data.
 * @return {Promise<boolean>} True if data exists at reference.
 */
export async function existsData(reference: admin.database.Reference): Promise<boolean> {
    return (await reference.once("value")).exists();
}

/**
 * Returns same value, but null if specified value is undefined.
 * @param {any} value Value to get undefined value.
 * @return {any} Same value, but null if specified value is undefined.
 */
export function undefinedAsNull<T>(value: T | undefined): T | null {
    return typeof value === "undefined" ? null: value;
}

/**
 * Contains name and propoerties of a statistic.
 */
interface Statistic<Properties extends StatisticsProperties<StatisticsPropertiesObject>, StatisticsPropertiesObject> {

    /**
     * Name of the statistic.
     */
    name: string;

    /**
     * Properties of the statistic.
     */
    properties: Properties;
}

export interface StatisticsProperties<StatisticsPropertiesObject> {
    object: StatisticsPropertiesObject;
}

/**
 * Saves specifed statistic properties to specified club path.
 * @param {string} clubPath Path of club to save statistic to.
 * @param {Statistic} statistic Properties of statistic to save.
 */
export async function saveStatistic<Properties extends StatisticsProperties<StatisticsPropertiesObject>, StatisticsPropertiesObject>(clubPath: string, statistic: Statistic<Properties, StatisticsPropertiesObject>, loggingProperties?: LoggingProperties) {
    loggingProperties?.append("saveStatistic", {clubPath: clubPath, statistic: statistic});
    const path = `${clubPath}/statistics/${guid.newGuid().guidString}`;
    const reference = admin.database().ref(path);
    await reference.set({
        name: statistic.name,
        properties: statistic.properties.object,
        timestamp: Date.now(),
    });
}

/**
 * Interface for a firebase function with execute function method.
 */
export interface FirebaseFunction {

    /**
     * Executed this firebase function.
     * @param {{uid: string} | undefined} auth Authentication state.
     */
    executeFunction(auth?: { uid: string }): Promise<any>;
}

export interface UpdatePropertiesObject {
    timestamp: number;
    personId: string;
}

export class UpdateProperties {
    readonly timestamp: number;
    readonly personId: guid;

    constructor(timestamp: number, personId: guid) {
        this.timestamp = timestamp;
        this.personId = personId;
    }

    static fromObject(object: any, loggingProperties?: LoggingProperties): UpdateProperties {
        loggingProperties?.append("UpdateProperties.fromObject", {object: object});

        // Check if object is from type object
        if (typeof object !== "object")
            throw httpsError("invalid-argument", `Couldn't parse update properties, expected type 'object', but bot ${object} from type '${typeof object}'`, loggingProperties?.nextIndent);

        // Check if person id is string
        if (typeof object.personId !== "string")
            throw httpsError("invalid-argument", `Couldn't parse UpdateProperties parameter 'personId', expected type string but got '${object.personId}' from type ${typeof object.personId}`, loggingProperties?.nextIndent);
        const personId = guid.fromString(object.personId, loggingProperties?.nextIndent);

        // Check if timestamp is a positive number
        if (typeof object.timestamp !== "number" || object.timestamp < 0)
            throw httpsError("invalid-argument", `Couldn't parse UpdateProperties parameter 'timestamp', expected positive number but got '${object.timestamp}' from type ${typeof object.timestamp}`, loggingProperties?.nextIndent);

        return new UpdateProperties(object.timestamp, personId);
    }

    static fromSnapshot(snapshot: PrimitveDataSnapshot, loggingProperties?: LoggingProperties): UpdateProperties {
        loggingProperties?.append("UpdateProperties.fromSnapshot", {snapshot: snapshot});

        // Check if data exists in snapshot
        if (!snapshot.exists())
            throw httpsError("invalid-argument", "Couldn't parse UpdateProperties since no data exists in snapshot.", loggingProperties?.nextIndent);

        const data = snapshot.val();
        if (typeof data !== "object")
            throw httpsError("invalid-argument", `Couldn't parse UpdateProperties from snapshot since data isn't an object: ${data}`, loggingProperties?.nextIndent);

        return UpdateProperties.fromObject(data, loggingProperties?.nextIndent);
    }

    static fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties?: LoggingProperties): UpdateProperties {
        loggingProperties?.append("UpdateProperties.fromParameterContainer", {container: container, parameterName: parameterName});
        return UpdateProperties.fromObject(container.getParameter(parameterName, "object", loggingProperties?.nextIndent), loggingProperties?.nextIndent);
    }

    get ["object"](): UpdatePropertiesObject {
        return {
            timestamp: this.timestamp,
            personId: this.personId.guidString,
        };
    }
}

/**
 * Default parameters for firebase function with private key and club level.
 */
export interface FunctionDefaultParameters {

    /**
     * Private key for authentication.
     */
    privateKey: string;

    /**
     * Club level of firebase function.
     */
    clubLevel: ClubLevel;
}

export interface PrimitveDataSnapshot {
    exists(): boolean,
    key: string | null,
    val(): any
    child(path: string): PrimitveDataSnapshot
}

export function httpsError(code: functions.https.FunctionsErrorCode, message: string, properties?: LoggingProperties): functions.https.HttpsError {
    return new functions.https.HttpsError(code, message, properties?.joinedMessages);
}
