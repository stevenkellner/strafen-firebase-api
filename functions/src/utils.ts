import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {privateKey} from "./privateKeys";
import {guid} from "./TypeDefinitions/guid";
import {ClubLevel} from "./TypeDefinitions/ClubLevel";

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
}
