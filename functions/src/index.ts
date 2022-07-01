import * as admin from 'firebase-admin';
import { createFunction } from './utils';

import { ChangeFinePayedFunction } from './regularFunctions/ChangeFinePayedFunction';
import { ChangeFineFunction } from './regularFunctions/ChangeFineFunction';
import { ChangeReasonTemplateFunction } from './regularFunctions/ChangeReasonTemplateFunction';
import { ChangePersonFunction } from './regularFunctions/ChangePersonFunction';
import { ChangeLatePaymentInterestFunction } from './regularFunctions/ChangeLatePaymentInterestFunction';
import { ExistsClubWithIdentifierFunction } from './regularFunctions/ExistsClubWithIdentifierFunction';
import { ExistsPersonWithUserIdFunction } from './regularFunctions/ExistsPersonWithUserIdFunction';
import { ForceSignOutFunction } from './regularFunctions/ForceSignOutFunction';
import { GetClubIdFunction } from './regularFunctions/GetClubIdFunction';
import { GetPersonPropertiesFunction } from './regularFunctions/GetPersonPropertiesFunction';
import { NewClubFunction } from './regularFunctions/NewClubFunction';
import { RegisterPersonFunction } from './regularFunctions/RegisterPersonFunction';
import { NewTestClubFunction } from './testingFunctions/NewTestClubFunction';
import { DeleteTestClubsFunction } from './testingFunctions/DeleteTestClubsFunction';

admin.initializeApp();

/**
 * Changes payement state of fine with specified fine id.
 */
export const changeFinePayed = createFunction((data, auth) => new ChangeFinePayedFunction(data, auth));

/**
 * Changes a element of reason template list.
 */
export const changeReasonTemplate = createFunction((data, auth) => new ChangeReasonTemplateFunction(data, auth));

/**
 * Changes a element of fine list.
 */
export const changeFine = createFunction((data, auth) => new ChangeFineFunction(data, auth));

/**
 * Changes a element of person list.
 */
export const changePerson = createFunction((data, auth) => new ChangePersonFunction(data, auth));

/**
 * Changes the late payment interest.
 */
export const changeLatePaymentInterest =
    createFunction((data, auth) => new ChangeLatePaymentInterestFunction(data, auth));

/**
 * Checks if club with given identifier already exists.
 */
export const existsClubWithIdentifier =
    createFunction((data, auth) => new ExistsClubWithIdentifierFunction(data, auth));

/**
 * Checks if a person with given user id exists.
 */
export const existsPersonWithUserId = createFunction((data, auth) => new ExistsPersonWithUserIdFunction(data, auth));

/**
 * Force sign out a person.
 */
export const forceSignOut = createFunction((data, auth) => new ForceSignOutFunction(data, auth));

/**
 * Get club id with given club identifier.
 */
export const getClubId = createFunction((data, auth) => new GetClubIdFunction(data, auth));

/**
 * Returns club and person properties of user id.
 */
export const getPersonProperties = createFunction((data, auth) => new GetPersonPropertiesFunction(data, auth));

/**
 * Creates a new club with given properties.
 */
export const newClub = createFunction((data, auth) => new NewClubFunction(data, auth));

/**
 * Register person to club with given club id.
 */
export const registerPerson = createFunction((data, auth) => new RegisterPersonFunction(data, auth));

/**
 * Creates a new test club.
 */
export const newTestClub = createFunction((data, auth) => new NewTestClubFunction(data, auth));

/**
 * Deletes a test club.
 */
export const deleteTestClubs = createFunction((data, auth) => new DeleteTestClubsFunction(data, auth));
