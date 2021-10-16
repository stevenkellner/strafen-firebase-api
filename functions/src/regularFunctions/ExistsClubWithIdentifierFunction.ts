import * as admin from "firebase-admin";
import { ClubLevel } from "../TypeDefinitions/ClubLevel";
import { guid } from "../TypeDefinitions/guid";
import { LoggingProperties } from "../TypeDefinitions/LoggingProperties";
import { ParameterContainer } from "../TypeDefinitions/ParameterContainer";
import { checkPrerequirements, FirebaseFunction, FunctionDefaultParameters } from "../utils";

/**
 * @summary
 * Checks if club with given identifier already exists.
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - clubLevel ({@link ClubLevel}): level of the club
 *  - identifier ({@link guid}): identifer of the club to search
 *
 * @returns (boolean): `true` if a club with given identifier already exists, `false` otherwise
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 */
export class ExistsClubWithIdentifierFunction implements FirebaseFunction {

    /**
     * Parameters needed for this function.
     */
    private parameters: ExistsClubWithIdentifierFunction.Parameters;

    private loggingProperties: LoggingProperties;

    /**
     * Initilizes function with given over data.
     * @param {any} data Data to get parameters from.
     */
    constructor(data: any) {
        const parameterContainer = new ParameterContainer(data);
        this.loggingProperties = LoggingProperties.withFirst(parameterContainer, "ExistsClubWithIdentifierFunction.constructor", {data: data}, "notice");
        this.parameters = ExistsClubWithIdentifierFunction.parseParameters(parameterContainer, this.loggingProperties.nextIndent);
    }

    /**
     * Parses parameters for this function from a parameter container.
     * @param {ParameterContainer} container Parameter container to get parameters from.
     * @return {Parameters} Parsed parameters for this function.
     */
    private static parseParameters(container: ParameterContainer, loggingProperties: LoggingProperties): ExistsClubWithIdentifierFunction.Parameters {
        loggingProperties.append("ExistsClubWithIdentifierFunction.parseParameter", {container: container});
        return {
            privateKey: container.getParameter("privateKey", "string", loggingProperties.nextIndent),
            clubLevel: new ClubLevel.Builder().fromParameterContainer(container, "clubLevel", loggingProperties.nextIndent),
            identifier: guid.fromParameterContainer(container, "identifier", loggingProperties.nextIndent),
        };
    }

    /**
     * Executes this firebase function.
     * @param {{uid: string} | undefined} auth Authentication state.
     */
    async executeFunction(auth?: { uid: string }): Promise<boolean> {
        this.loggingProperties.append("ExistsClubWithIdentifierFunction.executeFunction", {auth: auth}, "info");

        // Check prerequirements
        const clubPath = `${this.parameters.clubLevel.clubComponent}/${this.parameters.identifier.guidString}`;
        await checkPrerequirements(this.parameters, this.loggingProperties.nextIndent, auth);

        // Check if club identifier exists
        const clubRef = admin.database().ref(clubPath);
        const snapshot = await clubRef.once("value");
        return snapshot.exists();
    }
}

export namespace ExistsClubWithIdentifierFunction {

    export type Parameters = FunctionDefaultParameters & {
        identifier: guid,
    }
}
