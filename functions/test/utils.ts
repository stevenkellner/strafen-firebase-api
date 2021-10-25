import {initializeApp} from "firebase/app";
import {getFunctions, httpsCallable, HttpsCallableResult} from "firebase/functions";
import {getDatabase, ref, onValue} from "firebase/database";
import {getAuth, signInWithEmailAndPassword, UserCredential} from "firebase/auth";
import {firebaseConfig} from "./firebaseConfig";
import { Fine } from "../src/TypeDefinitions/Fine";
import {guid} from "../src/TypeDefinitions/guid";
import {ReasonTemplate} from "../src/TypeDefinitions/ReasonTemplate";
import {Person} from "../src/TypeDefinitions/Person";
import { LoggingProperties } from "../src/TypeDefinitions/LoggingProperties";
import { Deleted } from "../src/utils";
import { getUpdatable, Updatable } from "../src/TypeDefinitions/UpdateProperties";

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, "europe-west1");
const database = getDatabase(app);
export const auth = getAuth();

export async function callFunction(functionName: string, parameters: any | null): Promise<HttpsCallableResult<unknown>> {
    return await httpsCallable(functions, functionName)(parameters);
}

export async function signIn(email: string, password: string): Promise<UserCredential> {
    return await signInWithEmailAndPassword(auth, email, password);
}

export async function signInTestUser(): Promise<UserCredential> {
    return await signIn("functions-tests-user@mail.com", "ghQshXA7rnDdGWj8GffSQN7VGrm9Qf3Z");
}

export async function getDatabaseOptionalValue(referencePath: string): Promise<any | null> {
    const reference = ref(database, referencePath);
    return new Promise((resolve, _) => {
        onValue(reference, snapshot => {
            if (!snapshot.exists())
                return resolve(null);
            resolve(snapshot.val());
        });
    });
}

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

export async function getDatabaseFines(clubId: guid, loggingProperties: LoggingProperties): Promise<Updatable<Fine | Deleted<guid>>[]> {
    loggingProperties.append("getDatabaseFines", {clubId: clubId});
    return Object.entries(await getDatabaseValue(`testableClubs/${clubId.guidString}/fines`)).map(value => {
        return getUpdatable({
            id: value[0],
            ...(value[1] as any),
        }, new Fine.Builder(), loggingProperties.nextIndent);
    });
}

export async function getDatabaseReasonTemplates(clubId: guid, loggingProperties: LoggingProperties): Promise<Updatable<ReasonTemplate | Deleted<guid>>[]> {
    loggingProperties.append("getDatabaseReasonTemplates", {clubId: clubId});
    return Object.entries(await getDatabaseValue(`testableClubs/${clubId.guidString}/reasonTemplates`)).map(value => {
        return getUpdatable({
            id: value[0],
            ...(value[1] as any),
        }, new ReasonTemplate.Builder(), loggingProperties.nextIndent);
    });
}

export async function getDatabasePersons(clubId: guid, loggingProperties: LoggingProperties): Promise<Updatable<Person | Deleted<guid>>[]> {
    loggingProperties.append("getDatabasePersons", {clubId: clubId});
    return Object.entries(await getDatabaseValue(`testableClubs/${clubId.guidString}/persons`)).map(value => {
        return getUpdatable({
            id: value[0],
            ...(value[1] as any),
        }, new Person.Builder, loggingProperties.nextIndent);
    });
}

export async function getDatabaseStatistics(clubId: guid, loggingProperties: LoggingProperties): Promise<{id: guid, name: string, timestamp: number, properties: any}[]> {
    loggingProperties.append("getDatabaseStatistics", {clubId: clubId});
    return Object.entries(await getDatabaseValue(`testableClubs/${clubId.guidString}/statistics`)).map(value => {
        return {
            id: guid.fromString(value[0], loggingProperties.nextIndent),
            name: (value[1] as any).name,
            timestamp: (value[1] as any).timestamp,
            properties: (value[1] as any).properties,
        };
    });
}

export async function getDatabaseStatisticsPropertiesWithName(clubId: guid, name: string, loggingProperties: LoggingProperties) {
    return (await getDatabaseStatistics(clubId, loggingProperties)).filter(statistic => statistic.name == name ).map(statistic => statistic.properties);
}

interface ErrorCodeAndMessage {
    code: string,
    message: string,
}

export function firebaseError(error: unknown): ErrorCodeAndMessage {
    const _errorCodeAndMessage = errorCodeAndMessage(error);
    if ((error as any).hasOwnProperty("name") && (error as any).name == "FirebaseError")
        return _errorCodeAndMessage;
    throw error;
}

export function errorCodeAndMessage(error: unknown): ErrorCodeAndMessage {
    if (typeof error == "object" && (error as any).hasOwnProperty("code") && (error as any).hasOwnProperty("message"))
        return {
            code: (error as any).code,
            message: (error as any).message,
        };
    throw error;
}
