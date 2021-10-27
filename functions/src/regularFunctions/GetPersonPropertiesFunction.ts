import * as admin from "firebase-admin";
import { ClubLevel } from "../TypeDefinitions/ClubLevel";
import { ClubProperties } from "../TypeDefinitions/ClubProperties";
import { LoggingProperties } from "../TypeDefinitions/LoggingProperties";
import { ParameterContainer } from "../TypeDefinitions/ParameterContainer";
import { PersonPropertiesWithIsAdmin } from "../TypeDefinitions/PersonPropertiesWithIsAdmin";
import { checkPrerequirements, FirebaseFunction, FunctionDefaultParameters, httpsError } from "../utils";

/**
 * @summary
 * Returns club and person properties of user id.
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - clubLevel ({@link ClubLevel}): level of the club (`regular`, `debug`, `testing`)
 *  - userId (string): user id to search in database
 *
 * @returns:
 *  - personProperties ({@link PersonProperties.ServerObject}) properties of person with specified user id
 *  - clubProperties ({@link ClubProperties.ServerObject}) properties of club
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - not-found: if no person with given user id was found
 */
export class GetPersonPropertiesFunction implements FirebaseFunction {

    /**
     * Parameters needed for this function.
     */
    private parameters: GetPersonPropertiesFunction.Parameters;

    private loggingProperties: LoggingProperties;

    /**
     * Initilizes function with given over data.
     * @param {any} data Data to get parameters from.
     */
    constructor(data: any) {
        const parameterContainer = new ParameterContainer(data);
        this.loggingProperties = LoggingProperties.withFirst(parameterContainer, "GetPersonPropertiesFunction.constructor", {data: data}, "notice");
        this.parameters = GetPersonPropertiesFunction.parseParameters(parameterContainer, this.loggingProperties.nextIndent);
    }

    /**
     * Parses parameters for this function from a parameter container.
     * @param {ParameterContainer} container Parameter container to get parameters from.
     * @return {Parameters} Parsed parameters for this function.
     */
    private static parseParameters(container: ParameterContainer, loggingProperties: LoggingProperties): GetPersonPropertiesFunction.Parameters {
        loggingProperties.append("GetPersonPropertiesFunction.parseParameter", {container: container});
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
    async executeFunction(auth?: { uid: string }): Promise<GetPersonPropertiesFunction.ReturnType.ServerObject> {
        this.loggingProperties.append("GetPersonPropertiesFunction.executeFunction", {auth: auth}, "info");

        // Check prerequirements
        await checkPrerequirements(this.parameters, this.loggingProperties.nextIndent, auth);

        // Get person properties
        const reference = admin.database().ref(this.parameters.clubLevel.clubComponent);
        let properties: GetPersonPropertiesFunction.ReturnType | null = null;
        (await reference.once("value")).forEach(clubSnapshot => {
            clubSnapshot.child("persons").forEach(personSnapshot => {
                const userId = personSnapshot.child("signInData").child("userId").val();
                if (userId == this.parameters.userId)
                    properties = new GetPersonPropertiesFunction.ReturnType(
                        new PersonPropertiesWithIsAdmin.Builder().fromValue({
                            id: personSnapshot.key,
                            signInDate: personSnapshot.child("signInData") .child("signInDate").val(),
                            isAdmin: personSnapshot.child("signInData").child("admin").val(),
                            name: {
                                first: personSnapshot.child("name").child("first").val(),
                                last: personSnapshot.child("name").child("last").val(),
                            },
                        }, this.loggingProperties.nextIndent),
                        new ClubProperties.Builder().fromValue({
                            id: clubSnapshot.key,
                            name: clubSnapshot.child("name").val(),
                            identifier: clubSnapshot.child("identifier").val(),
                            regionCode: clubSnapshot.child("regionCode").val(),
                            inAppPaymentActive: clubSnapshot.child("inAppPaymentActive").val(),
                        }, this.loggingProperties.nextIndent),
                    );
                return properties != null;
            });
            return properties != null;
        });

        // Return person properties
        if (properties == null)
            throw httpsError("not-found", "Person doesn't exist.", this.loggingProperties);
        return (properties as GetPersonPropertiesFunction.ReturnType).serverObject;
    }
}

export namespace GetPersonPropertiesFunction {

    export type Parameters = FunctionDefaultParameters & {
        userId: string,
    }

    export class ReturnType {
        public constructor(
            public readonly personProperties: PersonPropertiesWithIsAdmin,
            public readonly clubProperties: ClubProperties
        ) {}

        public get ["serverObject"](): ReturnType.ServerObject {
            return {
                personProperties: this.personProperties.serverObject,
                clubProperties: this.clubProperties.serverObject,
            };
        }
    }

    export namespace ReturnType {
        export interface ServerObject {
            personProperties: PersonPropertiesWithIsAdmin.ServerObject,
            clubProperties: ClubProperties.ServerObject,
        }
    }
}
