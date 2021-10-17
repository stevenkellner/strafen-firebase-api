import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import { ChangeFinePayedFunction } from "./regularFunctions/ChangeFinePayedFunction";
import { NewTestClubFunction } from "./testingFunctions/NewTestClubFunction";
import { DeleteTestClubsFunction } from "./testingFunctions/DeleteTestClubsFunction";
import { ChangeReasonTemplateFunction } from "./regularFunctions/ChangeReasonTemplateFunction";
import { ChangeFineFunction } from "./regularFunctions/ChangeFineFunction";
import { ChangePersonFunction } from "./regularFunctions/ChangePersonFunction";
import { ChangeLatePaymentInterestFunction } from "./regularFunctions/ChangeLatePaymentInterestFunction";
import { ExistsClubWithIdentifierFunction } from "./regularFunctions/ExistsClubWithIdentifierFunction";
import { ExistsPersonWithUserIdFunction } from "./regularFunctions/ExistsPersonWithUserIdFunction";
import { ForceSignOutFunction } from "./regularFunctions/ForceSignOutFunction";

admin.initializeApp();

/**
 * Changes payement state of fine with specified fine id.
 */
export const changeFinePayed = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new ChangeFinePayedFunction(data);
    return await firebaseFunction.executeFunction(context.auth);
});

/**
 * Changes a element of reason template list.
 */
export const changeReasonTemplate = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new ChangeReasonTemplateFunction(data);
    return await firebaseFunction.executeFunction(context.auth);
});

/**
 * Changes a element of fine list.
 */
export const changeFine = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new ChangeFineFunction(data);
    return await firebaseFunction.executeFunction(context.auth);
});

/**
 * Changes a element of person list.
 */
export const changePerson = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new ChangePersonFunction(data);
    return await firebaseFunction.executeFunction(context.auth);
});

/**
 * Changes the late payment interest.
 */
export const changeLatePaymentInterest = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new ChangeLatePaymentInterestFunction(data);
    return await firebaseFunction.executeFunction(context.auth);
});

/**
 * Checks if club with given identifier already exists.
 */
export const existsClubWithIdentifier = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new ExistsClubWithIdentifierFunction(data);
    return await firebaseFunction.executeFunction(context.auth);
});

/**
 * Checks if a person with given user id exists.
 */
export const existsPersonWithUserId = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new ExistsPersonWithUserIdFunction(data);
    return await firebaseFunction.executeFunction(context.auth);
});

/**
 * Force sign out a person.
 */
export const forceSignOut = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new ForceSignOutFunction(data);
    return await firebaseFunction.executeFunction(context.auth);
});

export const newTestClub = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new NewTestClubFunction(data);
    return await firebaseFunction.executeFunction(context.auth);
});

export const deleteTestClubs = functions.region("europe-west1").https.onCall(async (data, context) => {
    const firebaseFunction = new DeleteTestClubsFunction(data);
    return await firebaseFunction.executeFunction(context.auth);
});
