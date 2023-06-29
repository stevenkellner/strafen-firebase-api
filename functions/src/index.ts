import * as admin from 'firebase-admin';
import { createFirebaseFunctions } from 'firebase-function';
import { firebaseFunctions } from './functions/firebaseFunctions';
import { getPrivateKeys } from './privateKeys';

admin.initializeApp();

export = createFirebaseFunctions(getPrivateKeys, {}, firebaseFunctions);
