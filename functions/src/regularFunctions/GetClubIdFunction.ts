import * as admin from "firebase-admin";
import { ClubLevel } from "../TypeDefinitions/ClubLevel";
import { LoggingProperties } from "../TypeDefinitions/LoggingProperties";
import { ParameterContainer } from "../TypeDefinitions/ParameterContainer";
import { checkPrerequirements, FirebaseFunction, FunctionDefaultParameters, httpsError } from "../utils";

/**
 * @summary
 * Get club id with given club identifier.
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - clubLevel ({@link ClubLevel}): level of the club (`regular`, `debug`, `testing`)
 *  - identifier (string): identifer of the club to search
 *
 * @returns (string): club id of club with given identifer.
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - not-found: if no club with given identifier exists
 */
export class GetClubIdFunction implements FirebaseFunction {

    /**
     * Parameters needed for this function.
     */
    private parameters: GetClubIdFunction.Parameters;

    private loggingProperties: LoggingProperties;

    /**
     * Initilizes function with given over data.
     * @param {any} data Data to get parameters from.
     */
    constructor(data: any) {
        const parameterContainer = new ParameterContainer(data);
        this.loggingProperties = LoggingProperties.withFirst(parameterContainer, "GetClubIdFunction.constructor", {data: data}, "notice");
        this.parameters = GetClubIdFunction.parseParameters(parameterContainer, this.loggingProperties.nextIndent);
    }

    /**
     * Parses parameters for this function from a parameter container.
     * @param {ParameterContainer} container Parameter container to get parameters from.
     * @return {Parameters} Parsed parameters for this function.
     */
    private static parseParameters(container: ParameterContainer, loggingProperties: LoggingProperties): GetClubIdFunction.Parameters {
        loggingProperties.append("GetClubIdFunction.parseParameter", {container: container});
        return {
            privateKey: container.getParameter("privateKey", "string", loggingProperties.nextIndent),
            clubLevel: new ClubLevel.Builder().fromParameterContainer(container, "clubLevel", loggingProperties.nextIndent),
            identifier: container.getParameter("identifier", "string", loggingProperties.nextIndent),
        };
    }

    /**
     * Executes this firebase function.
     * @param {{uid: string} | undefined} auth Authentication state.
     */
    async executeFunction(auth?: { uid: string }): Promise<string> {
        this.loggingProperties.append("GetClubIdFunction.executeFunction", {auth: auth}, "info");

        // Check prerequirements
        await checkPrerequirements(this.parameters, this.loggingProperties.nextIndent, auth);

        // Get club id
        const reference = admin.database().ref(this.parameters.clubLevel.clubComponent);
        let clubId: string | null = null;
        (await reference.once("value")).forEach(clubSnapshot => {
            const identifier = clubSnapshot.child("identifier").val();
            if (identifier == this.parameters.identifier)
                clubId = clubSnapshot.key;
            return clubId != null;
        });

        // Return club id
        if (clubId == null)
            throw httpsError("not-found", "Club doesn't exists.", this.loggingProperties);
        return clubId;
    }
}

export namespace GetClubIdFunction {

    export type Parameters = FunctionDefaultParameters & {
        identifier: string,
    }
}
