import { Crypter, DatabaseType, VerboseType } from "firebase-function";
import { getPrivateKeys } from "../src/privateKeys";
import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseConfig } from "./privateKeys";
import { initializeApp } from "firebase/app";

const app = initializeApp(firebaseConfig);

export async function callASDF() {
    const databaseType = new DatabaseType('release');
    const crypter = new Crypter(getPrivateKeys(databaseType).cryptionKeys);
    const expiresAtIsoDate = new Date(new Date().getTime() + 60000).toISOString();
    const callableFunction = httpsCallable<{
        verbose: VerboseType.Value;
        databaseType: DatabaseType.Value;
        callSecret: unknown;
        parameters: string;
    }, {
        result: string;
        context: unknown;
    }>(getFunctions(app, 'europe-west1'), 'debug-asdf');
    await callableFunction({
        verbose: 'coloredVerbose',
        databaseType: databaseType.value,
        callSecret: {
            expiresAt: expiresAtIsoDate,
            hashedData: Crypter.sha512(expiresAtIsoDate, getPrivateKeys(databaseType).callSecretKey)
        },
        parameters: crypter.encodeEncrypt({})
    });
}
