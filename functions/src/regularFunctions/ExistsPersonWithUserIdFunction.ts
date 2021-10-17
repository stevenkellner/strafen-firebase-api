import * as admin from "firebase-admin";
import { ClubLevel } from "../TypeDefinitions/ClubLevel";
import { LoggingProperties } from "../TypeDefinitions/LoggingProperties";
import { ParameterContainer } from "../TypeDefinitions/ParameterContainer";
import { checkPrerequirements, FirebaseFunction, FunctionDefaultParameters } from "../utils";

/**
 * @summary
 * Checks if a person with given user id exists.
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - clubLevel ({@link ClubLevel}): level of the club (`regular`, `debug`, `testing`)
 *  - userId (string): user id to search in database
 *
 * @returns (boolean): `true`if a person with given user id exists
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 */
export class ExistsPersonWithUserIdFunction implements FirebaseFunction {

    /**
     * Parameters needed for this function.
     */
    private parameters: ExistsPersonWithUserIdFunction.Parameters;

    private loggingProperties: LoggingProperties;

    /**
     * Initilizes function with given over data.
     * @param {any} data Data to get parameters from.
     */
    constructor(data: any) {
        const parameterContainer = new ParameterContainer(data);
        this.loggingProperties = LoggingProperties.withFirst(parameterContainer, "ExistsPersonWithUserIdFunction.constructor", {data: data}, "notice");
        this.parameters = ExistsPersonWithUserIdFunction.parseParameters(parameterContainer, this.loggingProperties.nextIndent);
    }

    /**
     * Parses parameters for this function from a parameter container.
     * @param {ParameterContainer} container Parameter container to get parameters from.
     * @return {Parameters} Parsed parameters for this function.
     */
    private static parseParameters(container: ParameterContainer, loggingProperties: LoggingProperties): ExistsPersonWithUserIdFunction.Parameters {
        loggingProperties.append("ExistsPersonWithUserIdFunction.parseParameter", {container: container});
        return {
            privateKey: container.getParameter("privateKey", "string", loggingProperties.nextIndent),
            clubLevel: new ClubLevel.Builder().fromParameterContainer(container, "clubLevel", loggingProperties.nextIndent),
            userId: container.getParameter("userId", "string", loggingProperties.nextIndent),
        };
    }

    /**
     * Executes this firebase function.
     * @param {{uid: string} | undefined} auth Authentication state.
     */
    async executeFunction(auth?: { uid: string }): Promise<boolean> {
        this.loggingProperties.append("ExistsPersonWithUserIdFunction.executeFunction", {auth: auth}, "info");

        // Check prerequirements
        await checkPrerequirements(this.parameters, this.loggingProperties.nextIndent, auth);

        // Check if person exists
        const reference = admin.database().ref(this.parameters.clubLevel.clubComponent);
        let personExists = false;
        (await reference.once("value")).forEach(clubSnapshot => {
            personExists = clubSnapshot.child("personUserIds").child(this.parameters.userId).exists();
            return personExists;
        });
        return personExists;
    }
}

export namespace ExistsPersonWithUserIdFunction {

    export type Parameters = FunctionDefaultParameters & {
        userId: string,
    }
}
