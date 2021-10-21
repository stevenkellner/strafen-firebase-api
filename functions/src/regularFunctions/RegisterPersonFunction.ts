import * as admin from "firebase-admin";
import { ClubLevel } from "../TypeDefinitions/ClubLevel";
import { ClubProperties } from "../TypeDefinitions/ClubProperties";
import { guid } from "../TypeDefinitions/guid";
import { LoggingProperties } from "../TypeDefinitions/LoggingProperties";
import { ParameterContainer } from "../TypeDefinitions/ParameterContainer";
import { PersonPropertiesWithUserId } from "../TypeDefinitions/PersonPropertiesWithUserId";
import { checkPrerequirements, FirebaseFunction, FunctionDefaultParameters, httpsError } from "../utils";

/**
 * @summary
 * Register person to club with given club id.
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - clubLevel ({@link ClubLevel}): level of the club (`regular`, `debug`, `testing`)
 *  - clubId ({@link} guid): id of the club to register the person
 *  - personProperties ({@link PersonPropertiesWithUserId}): properties of the person signed in
 *
 * @returns
 *  - ...({@link ClubProperties.ServerObject}): properties of club
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - internal: if couldn't create person in database
 */
export class RegisterPersonFunction implements FirebaseFunction {

    /**
     * Parameters needed for this function.
     */
    private parameters: RegisterPersonFunction.Parameters;

    private loggingProperties: LoggingProperties;

    /**
     * Initilizes function with given over data.
     * @param {any} data Data to get parameters from.
     */
    constructor(data: any) {
        const parameterContainer = new ParameterContainer(data);
        this.loggingProperties = LoggingProperties.withFirst(parameterContainer, "RegisterPersonFunction.constructor", {data: data}, "notice");
        this.parameters = RegisterPersonFunction.parseParameters(parameterContainer, this.loggingProperties.nextIndent);
    }

    /**
     * Parses parameters for this function from a parameter container.
     * @param {ParameterContainer} container Parameter container to get parameters from.
     * @return {Parameters} Parsed parameters for this function.
     */
    private static parseParameters(container: ParameterContainer, loggingProperties: LoggingProperties): RegisterPersonFunction.Parameters {
        loggingProperties.append("RegisterPersonFunction.parseParameter", {container: container});
        return {
            privateKey: container.getParameter("privateKey", "string", loggingProperties.nextIndent),
            clubLevel: new ClubLevel.Builder().fromParameterContainer(container, "clubLevel", loggingProperties.nextIndent),
            clubId: guid.fromParameterContainer(container, "clubId", loggingProperties.nextIndent),
            personProperties: new PersonPropertiesWithUserId.Builder().fromParameterContainer(container, "personProperties", loggingProperties.nextIndent),
        };
    }

    /**
     * Executes this firebase function.
     * @param {{uid: string} | undefined} auth Authentication state.
     */
    async executeFunction(auth?: { uid: string }): Promise<ClubProperties.ServerObject> {
        this.loggingProperties.append("RegisterPersonFunction.executeFunction", {auth: auth}, "info");

        // Check prerequirements
        const clubPath = `${this.parameters.clubLevel.clubComponent}/${this.parameters.clubId.guidString}`;
        await checkPrerequirements(this.parameters, this.loggingProperties.nextIndent, auth, this.parameters.clubId);


        // Get person properties
        const person = {
            name: this.parameters.personProperties.name,
            signInData: {
                cashier: false,
                userId: this.parameters.personProperties.userId,
                signInDate: this.parameters.personProperties.signInDate.toISOString(),
            },
        };

        // Register person
        const personRef = admin.database().ref(`${clubPath}/persons/${this.parameters.personProperties.id.guidString}`);
        await personRef.set(person, error => {
            if (error != null)
                throw httpsError("internal", "Couldn't register person to database.", this.loggingProperties);
        });
        const personUserIdRef = admin.database().ref(`${clubPath}/personUserIds/${this.parameters.personProperties.userId}`);
        await personUserIdRef.set(this.parameters.personProperties.id.guidString, error => {
            if (error != null)
                throw httpsError("internal", "Couldn't register person to database.", this.loggingProperties);
        });

        // Get club properties to return
        const clubRef = admin.database().ref(clubPath);
        const clubSnapshot = await clubRef.once("value");
        const clubProperties = new ClubProperties.Builder().fromValue({
            id: clubSnapshot.key,
            name: clubSnapshot.child("name").val(),
            identifier: clubSnapshot.child("identifier").val(),
            regionCode: clubSnapshot.child("regionCode").val(),
            inAppPaymentActive: clubSnapshot.child("inAppPaymentActive").val(),
        }, this.loggingProperties.nextIndent);

        return clubProperties.serverObject;
    }
}

export namespace RegisterPersonFunction {

    export type Parameters = FunctionDefaultParameters & {
        clubId: guid,
        personProperties: PersonPropertiesWithUserId,
    }
}
