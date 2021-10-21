import * as admin from "firebase-admin";
import { ClubLevel } from "../TypeDefinitions/ClubLevel";
import { ClubProperties } from "../TypeDefinitions/ClubProperties";
import { LoggingProperties } from "../TypeDefinitions/LoggingProperties";
import { ParameterContainer } from "../TypeDefinitions/ParameterContainer";
import { PersonPropertiesWithUserId } from "../TypeDefinitions/PersonPropertiesWithUserId";
import { checkPrerequirements, existsData, FirebaseFunction, FunctionDefaultParameters, httpsError } from "../utils";

/**
 * @summary
 * Creates a new club with given properties.
 * Doesn't update club, if already a club with same club id exists.
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - clubLevel ({@link ClubLevel}): level of the club (`regular`, `debug`, `testing`)
 *  - clubProperties ({@link ClubProperties}): properties of the club to be created
 *  - personProperties ({@link PersonPropertiesWithUserId}): properties of the person signed in
 *
 * @throws
 *  - functions.https.HttpsError:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - internal: if couldn't create new club in database
 *    - already-exists: if already a club with given identifier exists
 */
export class NewClubFunction implements FirebaseFunction {

    /**
     * Parameters needed for this function.
     */
    private parameters: NewClubFunction.Parameters;

    private loggingProperties: LoggingProperties;

    /**
     * Initilizes function with given over data.
     * @param {any} data Data to get parameters from.
     */
    constructor(data: any) {
        const parameterContainer = new ParameterContainer(data);
        this.loggingProperties = LoggingProperties.withFirst(parameterContainer, "NewClubFunction.constructor", {data: data}, "notice");
        this.parameters = NewClubFunction.parseParameters(parameterContainer, this.loggingProperties.nextIndent);
    }

    /**
     * Parses parameters for this function from a parameter container.
     * @param {ParameterContainer} container Parameter container to get parameters from.
     * @return {Parameters} Parsed parameters for this function.
     */
    private static parseParameters(container: ParameterContainer, loggingProperties: LoggingProperties): NewClubFunction.Parameters {
        loggingProperties.append("NewClubFunction.parseParameter", {container: container});
        return {
            privateKey: container.getParameter("privateKey", "string", loggingProperties.nextIndent),
            clubLevel: new ClubLevel.Builder().fromParameterContainer(container, "clubLevel", loggingProperties.nextIndent),
            clubProperties: new ClubProperties.Builder().fromParameterContainer(container, "clubProperties", loggingProperties.nextIndent),
            personProperties: new PersonPropertiesWithUserId.Builder().fromParameterContainer(container, "personProperties", loggingProperties.nextIndent),
        };
    }

    /**
     * Executes this firebase function.
     * @param {{uid: string} | undefined} auth Authentication state.
     */
    async executeFunction(auth?: { uid: string }): Promise<void> {
        this.loggingProperties.append("NewClubFunction.executeFunction", {auth: auth}, "info");

        // Check prerequirements
        await checkPrerequirements(this.parameters, this.loggingProperties.nextIndent, auth);

        // Check if club with identifier already exists
        const reference = admin.database().ref(this.parameters.clubLevel.clubComponent);
        let clubExists = false;
        (await reference.once("value")).forEach(clubSnapshot => {
            clubExists = clubSnapshot.child("identifier").val() == this.parameters.clubProperties.identifier;
            return clubExists;
        });
        if (clubExists)
            throw httpsError( "already-exists", "Club identifier already exists", this.loggingProperties);

        // Get a reference to the club to be created
        const clubPath = `${this.parameters.clubLevel.clubComponent}/${this.parameters.clubProperties.id.guidString}`;
        const clubRef = admin.database().ref(clubPath);

        // Check if club already exists with given id
        if (await existsData(clubRef)) return;

        // Properties of club to be created
        const clubProperties = {
            identifier: this.parameters.clubProperties.identifier,
            name: this.parameters.clubProperties.name,
            regionCode: this.parameters.clubProperties.regionCode,
            inAppPaymentActive: this.parameters.clubProperties.inAppPaymentActive,
            personUserIds: {
                [this.parameters.personProperties.userId]: this.parameters.personProperties.id.guidString,
            },
            persons: {
                [this.parameters.personProperties.id.guidString]: {
                    name: this.parameters.personProperties.name.serverObject,
                    signInData: {
                        cashier: true,
                        userId: this.parameters.personProperties.userId,
                        signInDate: this.parameters.personProperties.signInDate.toISOString(),
                    },
                },
            },
        };

        // Set club properties
        await clubRef.set(clubProperties, async (error) => {
            if (error != null)
                throw httpsError("internal", `Couldn't add new club, underlying error: ${error.name}, ${error.message}`, this.loggingProperties);
        });
    }
}

export namespace NewClubFunction {

    export type Parameters = FunctionDefaultParameters & {
        clubProperties: ClubProperties,
        personProperties: PersonPropertiesWithUserId,
    }
}
