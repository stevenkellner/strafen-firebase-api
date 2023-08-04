import { Crypter, DatabaseType, UtcDate, VerboseType } from "firebase-function";
import { argv } from "process";
import { getPrivateKeys } from "./privateKeys";
import { getFunctions, httpsCallable } from "firebase/functions";
import { CallSecret } from "firebase-function/lib/src/CallSecret";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../test/privateKeys";

const databaseTypeValue = argv[2];
if (databaseTypeValue !== 'release' && databaseTypeValue !== 'debug')
    throw new Error(`Invalid database type: ${databaseTypeValue}`);
const databaseType = new DatabaseType(databaseTypeValue);

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'europe-west1');

const crypter = new Crypter(getPrivateKeys(databaseType).cryptionKeys);
const expiresAtUtcDate = UtcDate.now.advanced({ minute: 1 });
const callableFunction = httpsCallable<{
    verbose: VerboseType.Value;
    databaseType: DatabaseType.Value;
    callSecret: CallSecret;
    parameters: string;
}, {
    result: string;
    context: unknown;
}>(functions, 'debug-migrate-database');
callableFunction({
    verbose: 'coloredVerbose',
    databaseType: databaseType.value,
    callSecret: {
        expiresAt: expiresAtUtcDate.encoded,
        hashedData: Crypter.sha512(expiresAtUtcDate.encoded, getPrivateKeys(databaseType).callSecretKey)
    },
    parameters: crypter.encodeEncrypt({})
});
