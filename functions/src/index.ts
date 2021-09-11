import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {executeFunction} from "./utils";

import {ChangeFinePayedFunction} from "./regularFunctions/ChangeFinePayedFunction";
import {NewTestClubFunction} from "./testingFunctions/NewTestClubFunction";
import {DeleteTestClubsFunction} from "./testingFunctions/DeleteTestClubsFunction";
import {ChangeReasonTemplateFunction} from "./regularFunctions/ChangeReasonTemplateFunction";
import {ChangeFineFunction} from "./regularFunctions/ChangeFineFunction";

admin.initializeApp();

/**
 * Changes payement state of fine with specified fine id.
 */
export const changeFinePayed = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new ChangeFinePayedFunction(data);
    const functionResult = await executeFunction(firebaseFunction, context.auth);
    return functionResult.get();
});

/**
 * Changes a element of reason template list.
 */
export const changeReasonTemplate = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new ChangeReasonTemplateFunction(data);
    const functionResult = await executeFunction(firebaseFunction, context.auth);
    return functionResult.get();
});

/**
 * Changes a element of fine list.
 */
export const changeFine = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new ChangeFineFunction(data);
    const functionResult = await executeFunction(firebaseFunction, context.auth);
    return functionResult.get();
});

export const newTestClub = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new NewTestClubFunction(data);
    const functionResult = await executeFunction(firebaseFunction, context.auth);
    return functionResult.get();
});

export const deleteTestClubs = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new DeleteTestClubsFunction(data);
    const functionResult = await executeFunction(firebaseFunction, context.auth);
    return functionResult.get();
});
