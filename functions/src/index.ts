import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import {ChangeFinePayedFunction} from "./regularFunctions/ChangeFinePayedFunction";
import {NewTestClubFunction} from "./testingFunctions/NewTestClubFunction";
import {DeleteTestClubsFunction} from "./testingFunctions/DeleteTestClubsFunction";
import {ChangeReasonTemplateFunction} from "./regularFunctions/ChangeReasonTemplateFunction";
import {ChangeFineFunction} from "./regularFunctions/ChangeFineFunction";
import {ChangePersonFunction} from "./regularFunctions/ChangePersonFunction";
import {ChangeLatePaymentInterestFunction} from "./regularFunctions/ChangeLatePaymentInterestFunction";

admin.initializeApp();

/**
 * Changes payement state of fine with specified fine id.
 */
export const changeFinePayed = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new ChangeFinePayedFunction(data);
    await firebaseFunction.executeFunction(context.auth);
});

/**
 * Changes a element of reason template list.
 */
export const changeReasonTemplate = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new ChangeReasonTemplateFunction(data);
    await firebaseFunction.executeFunction(context.auth);
});

/**
 * Changes a element of fine list.
 */
export const changeFine = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new ChangeFineFunction(data);
    await firebaseFunction.executeFunction(context.auth);
});

/**
 * Changes a element of person list.
 */
export const changePerson = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new ChangePersonFunction(data);
    await firebaseFunction.executeFunction(context.auth);
});

/**
 * Changes the late payment interest.
 */
export const changeLatePaymentInterest = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new ChangeLatePaymentInterestFunction(data);
    await firebaseFunction.executeFunction(context.auth);
});

export const newTestClub = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new NewTestClubFunction(data);
    await firebaseFunction.executeFunction(context.auth);
});

export const deleteTestClubs = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new DeleteTestClubsFunction(data);
    await firebaseFunction.executeFunction(context.auth);
});
