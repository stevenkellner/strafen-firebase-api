import * as admin from "firebase-admin";
import { ClubLevel } from "../TypeDefinitions/ClubLevel";
import { guid } from "../TypeDefinitions/guid";
import { LoggingProperties } from "../TypeDefinitions/LoggingProperties";
import { ParameterContainer } from "../TypeDefinitions/ParameterContainer";
import { checkPrerequirements, existsData, FirebaseFunction, FunctionDefaultParameters, httpsError } from "../utils";

/**
 * @summary
 * Force sign out a person.
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - clubLevel ({@link ClubLevel}): level of the club (`regular`, `debug`, `testing`)
 *  - clubId ({@link guid}): id of the club to force sign out the person
 *  - personId ({@link guid}): id of person to be force signed out
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - internal: if an error occurs while force sign out the person in database
 */
export class ForceSignOutFunction implements FirebaseFunction {

    /**
     * Parameters needed for this function.
     */
    private parameters: ForceSignOutFunction.Parameters;

    private loggingProperties: LoggingProperties;

    /**
     * Initilizes function with given over data.
     * @param {any} data Data to get parameters from.
     */
    constructor(data: any) {
        const parameterContainer = new ParameterContainer(data);
        this.loggingProperties = LoggingProperties.withFirst(parameterContainer, "ForceSignOutFunction.constructor", {data: data}, "notice");
        this.parameters = ForceSignOutFunction.parseParameters(parameterContainer, this.loggingProperties.nextIndent);
    }

    /**
     * Parses parameters for this function from a parameter container.
     * @param {ParameterContainer} container Parameter container to get parameters from.
     * @return {Parameters} Parsed parameters for this function.
     */
    private static parseParameters(container: ParameterContainer, loggingProperties: LoggingProperties): ForceSignOutFunction.Parameters {
        loggingProperties.append("ForceSignOutFunction.parseParameter", {container: container});
        return {
            privateKey: container.getParameter("privateKey", "string", loggingProperties.nextIndent),
            clubLevel: new ClubLevel.Builder().fromParameterContainer(container, "clubLevel", loggingProperties.nextIndent),
            clubId: guid.fromParameterContainer(container, "clubId", loggingProperties.nextIndent),
            personId: guid.fromParameterContainer(container, "personId", loggingProperties.nextIndent),
        };
    }

    /**
     * Executes this firebase function.
     * @param {{uid: string} | undefined} auth Authentication state.
     */
    async executeFunction(auth?: { uid: string }): Promise<void> {
        this.loggingProperties.append("ForceSignOutFunction.executeFunction", {auth: auth}, "info");

        // Check prerequirements
        const clubPath = `${this.parameters.clubLevel.clubComponent}/${this.parameters.clubId.guidString}`;
        await checkPrerequirements(this.parameters, this.loggingProperties.nextIndent, auth, this.parameters.clubId);
        const signInDataPath = `${clubPath}/persons/${this.parameters.personId.guidString}/signInData`;
        const signInDataRef = admin.database().ref(signInDataPath);

        // Check if person is signed in
        if (!(await existsData(signInDataRef))) return;

        // Get user id
        const userIdSnapshot = await signInDataRef.child("userId").once("value");
        if (!userIdSnapshot.exists() || typeof userIdSnapshot.val() !== "string")
            throw httpsError("internal", "No valid user id in sign in data.", this.loggingProperties);
        const userId: string = userIdSnapshot.val();

        // Delete sign in data
        await signInDataRef.remove(error => {
            if (error != null)
                throw httpsError("internal", `Couldn't delete sign in data, underlying error: ${error.name}, ${error.message}`, this.loggingProperties);
        });

        // Delete user id in personUserIds
        const personUserIdPath = `${clubPath}/personUserIds/${userId}`;
        const personUserIdRef = admin.database().ref(personUserIdPath);
        if (await existsData(personUserIdRef)) {
            await personUserIdRef.remove((error) => {
                if (error != null)
                    throw httpsError("internal", `Couldn't delete person user id, underlying error: ${error.name}, ${error.message}`, this.loggingProperties);
            });
        }
    }
}

export namespace ForceSignOutFunction {

    export type Parameters = FunctionDefaultParameters & {
        clubId: guid,
        personId: guid,
    }
}
