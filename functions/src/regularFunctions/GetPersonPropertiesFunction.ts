import * as admin from "firebase-admin";
import { ClubLevel } from "../TypeDefinitions/ClubLevel";
import { guid } from "../TypeDefinitions/guid";
import { LoggingProperties } from "../TypeDefinitions/LoggingProperties";
import { ParameterContainer } from "../TypeDefinitions/ParameterContainer";
import { PersonName } from "../TypeDefinitions/PersonName";
import { checkPrerequirements, FirebaseFunction, FunctionDefaultParameters, httpsError } from "../utils";

class ClubProperties {
    public constructor(
        public readonly id: guid,
        public readonly name: string,
        public readonly identifier: string,
        public readonly regionCode: string,
        public readonly inAppPaymentActive: boolean
    ) {}

    public get ["serverObject"](): ClubProperties.ServerObject {
        return {
            id: this.id.guidString,
            name: this.name,
            identifier: this.identifier,
            regionCode: this.regionCode,
            inAppPaymentActive: this.inAppPaymentActive,
        };
    }
}

namespace ClubProperties {
    export interface ServerObject {
        id: string,
        name: string,
        identifier: string,
        regionCode: string,
        inAppPaymentActive: boolean,
    }
}

class PersonProperties {
    public constructor(
        public readonly clubProperties: ClubProperties,
        public readonly id: guid,
        public readonly signInDate: string,
        public readonly isCashier: boolean,
        public readonly name: PersonName
    ) {}

    public get ["serverObject"](): PersonProperties.ServerObject {
        return {
            clubProperties: this.clubProperties.serverObject,
            id: this.id.guidString,
            signInDate: this.signInDate,
            isCashier: this.isCashier,
            name: this.name.serverObject,
        };
    }
}

namespace PersonProperties {
    export interface ServerObject {
        clubProperties: ClubProperties.ServerObject,
        id: string,
        signInDate: string,
        isCashier: boolean,
        name: PersonName.ServerObject
    }
}

/**
 * @summary
 * Returns club and person properties of user id.
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - clubLevel ({@link ClubLevel}): level of the club (`regular`, `debug`, `testing`)
 *  - userId (string): user id to search in database
 *
 * @returns: ({@link PersonProperties.ServerObject}) properties of person with specified user id
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
    async executeFunction(auth?: { uid: string }): Promise<PersonProperties.ServerObject> {
        this.loggingProperties.append("GetPersonPropertiesFunction.executeFunction", {auth: auth}, "info");

        // Check prerequirements
        await checkPrerequirements(this.parameters, this.loggingProperties.nextIndent, auth);

        // Get person properties
        const reference = admin.database().ref(this.parameters.clubLevel.clubComponent);
        let personProperties: PersonProperties | null = null;
        (await reference.once("value")).forEach(clubSnapshot => {
            clubSnapshot.child("persons").forEach(personSnapshot => {
                const userId = personSnapshot.child("signInData").child("userId").val();
                if (userId == this.parameters.userId)
                    personProperties = new PersonProperties(
                        new ClubProperties(
                            guid.fromString(clubSnapshot.key ?? "", this.loggingProperties.nextIndent),
                            clubSnapshot.child("name").val(),
                            clubSnapshot.child("identifier").val(),
                            clubSnapshot.child("regionCode").val(),
                            clubSnapshot.child("inAppPaymentActive").val()
                        ),
                        guid.fromString(personSnapshot.key ?? "", this.loggingProperties.nextIndent),
                        personSnapshot.child("signInData") .child("signInDate").val(),
                        personSnapshot.child("signInData").child("cashier").val(),
                        new PersonName(
                            personSnapshot.child("name").child("first").val(),
                            personSnapshot.child("name").child("last").val()
                        )
                    );
                return personProperties != null;
            });
            return personProperties != null;
        });

        // Return person properties
        if (personProperties == null)
            throw httpsError("not-found", "Person doesn't exist.", this.loggingProperties);
        return (personProperties as any).serverObject;
    }
}

export namespace GetPersonPropertiesFunction {

    export type Parameters = FunctionDefaultParameters & {
        userId: string,
    }
}
