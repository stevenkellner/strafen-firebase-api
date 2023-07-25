import * as admin from 'firebase-admin';
import { FirebaseFunctionDescriptor, createFirebaseFunctions } from 'firebase-function';
import { firebaseFunctions } from './firebaseFunctions';
import { getPrivateKeys } from './privateKeys';
import { MigrateDatabaseFunction, type MigrateDatabaseFunctionType } from './functions/MigrateDatabaseFunction';

admin.initializeApp();

export = createFirebaseFunctions(getPrivateKeys, firebaseFunctions, {
    ...firebaseFunctions,
    migrate: {
        database: FirebaseFunctionDescriptor.create<MigrateDatabaseFunctionType>(MigrateDatabaseFunction)
    }
});
