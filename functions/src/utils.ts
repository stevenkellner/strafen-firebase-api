import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {privateKey} from "./privateKeys";
import {guid} from "./TypeDefinitions/guid";
import {ClubLevel} from "./TypeDefinitions/ClubLevel";
import {ParameterContainer} from "./TypeDefinitions/ParameterContainer";

/**
 * Checks prerequirements for firebase function:
 *  - Checks if private key is valid.
 *  - Checks if authentication isn't null.
 *  - If club id isn't null, checks if person is in that club.
 * @param {FunctionDefaultParameters} parameter Parameters needed for this check.
 * @param {{ uid: string } | undefined} auth Authentication state.
 * @param {guid | undefined } clubId Id of club to check if person is in that club.
 */
export async function checkPrerequirements(parameter: FunctionDefaultParameters, auth?: { uid: string }, clubId?: guid) {

    // Check if key is valid
    if (parameter.privateKey != privateKey)
        throw new functions.https.HttpsError("permission-denied", "Private key is invalid.");

    // Check if user is authorized to call a function
    if (auth == null)
        throw new functions.https.HttpsError("permission-denied", "The function must be called while authenticated, nobody signed in.");

    // Check if person is sign in to club
    if (clubId != null) {
        const path = `${parameter.clubLevel.getClubComponent()}/${clubId.guidString}/personUserIds/${auth.uid}`;
        const ref = admin.database().ref(path);
        if (!await existsData(ref))
            throw new functions.https.HttpsError("permission-denied", "The function must be called while authenticated, person not in club.");
    }
}

export async function checkUpdateTimestamp(updatePropertiesPath: string, functionUpdateProperties: UpdateProperties) {

    // Get server update properties
    const updatePropertiesRef = admin.database().ref(updatePropertiesPath);
    const snapshot = await updatePropertiesRef.once("value");
    if (!snapshot.exists()) return;
    const serverUpdateProperties = UpdateProperties.fromObject(snapshot.val());

    // Check timestamp
    if (functionUpdateProperties.timestamp <= serverUpdateProperties.timestamp)
        throw new functions.https.HttpsError("cancelled", `Server value is newer or same old than updated value:\n\t- Server  : ${serverUpdateProperties.timestamp}\n\t- Function: ${functionUpdateProperties.timestamp}`);
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
export async function saveStatistic<Properties extends StatisticsProperties<StatisticsPropertiesObject>, StatisticsPropertiesObject>(clubPath: string, statistic: Statistic<Properties, StatisticsPropertiesObject>) {
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

    static fromObject(object: { [key: string]: any }): UpdateProperties {

        // Check if person id is string
        if (typeof object.personId !== "string")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse UpdateProperties parameter 'personId', expected type string but got '${object.personId}' from type ${typeof object.personId}`);
        const personId = guid.fromString(object.personId);

        // Check if timestamp is a positive number
        if (typeof object.timestamp !== "number" || object.timestamp < 0)
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse UpdateProperties parameter 'timestamp', expected positive number but got '${object.timestamp}' from type ${typeof object.timestamp}`);

        return new UpdateProperties(object.timestamp, personId);
    }

    static fromSnapshot(snapshot: PrimitveDataSnapshot): UpdateProperties {

        // Check if data exists in snapshot
        if (!snapshot.exists())
            throw new functions.https.HttpsError("invalid-argument", "Couldn't parse UpdateProperties since no data exists in snapshot.");

        const data = snapshot.val();
        if (typeof data !== "object")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse UpdateProperties from snapshot since data isn't an object: ${data}`);

        return UpdateProperties.fromObject(data);
    }

    static fromParameterContainer(container: ParameterContainer, parameterName: string): UpdateProperties {
        return UpdateProperties.fromObject(container.getParameter(parameterName, "object"));
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
