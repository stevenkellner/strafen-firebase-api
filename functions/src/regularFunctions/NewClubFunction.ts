import * as admin from 'firebase-admin';
import {
    checkPrerequirements,
    IFirebaseFunction,
    httpsError,
    reference,
    existsData,
} from '../utils';
import { ParameterContainer } from '../ParameterContainer';
import { DatabaseType } from '../TypeDefinitions/DatabaseType';
import { Logger } from '../Logger';
import { AuthData } from 'firebase-functions/lib/common/providers/https';
import { ClubProperties } from '../TypeDefinitions/ClubProperties';
import { PersonPropertiesWithUserId } from '../TypeDefinitions/PersonPropertiesWithUserId';
import { ParameterParser } from '../ParameterParser';
import { Crypter } from '../crypter/Crypter';
import { cryptionKeys } from '../privateKeys';

/**
 * @summary
 * Creates a new club with given properties.
 * Doesn't update club, if already a club with same club id exists.
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - databaseType ({@link DatabaseType}): level of the club (`regular`, `debug`, `testing`)
 *  - clubProperties ({@link ClubProperties}): properties of the club to be created
 *  - personProperties ({@link PersonPropertiesWithUserId}): properties of the person signed in
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - internal: if couldn't create new club in database
 *    - already-exists: if already a club with given identifier exists
 */
export class NewClubFunction implements IFirebaseFunction<
    NewClubFunction.Parameters,
    NewClubFunction.ReturnType
> {


    /**
     * Firebase function parameters passed to the firebase function.
     */
    public parameters: NewClubFunction.Parameters;

    /**
     * Logger to log this class.
     */
    private logger: Logger;

    /**
     * Constructs the firebase function with data and auth.
     * @param { any } data Data passed to this firebase function.
     * @param { AuthData | undefined } auth Authentication of person called this function.
     */
    public constructor(data: any, private readonly auth: AuthData | undefined) {
        this.logger = Logger.start(
            !!data.verbose,
            'NewClubFunction.constructor',
            { data, auth },
            'notice'
        );
        const parameterContainer = new ParameterContainer(data, this.logger.nextIndent);
        const parameterParser = new ParameterParser<NewClubFunction.Parameters>(
            {
                privateKey: 'string',
                databaseType: ['string', DatabaseType.fromString],
                clubProperties: ['object', ClubProperties.fromObject],
                personProperties: ['object', PersonPropertiesWithUserId.fromObject],
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    /**
     * Executes this firebase function.
     */
    async executeFunction(): Promise<NewClubFunction.ReturnType> {
        this.logger.append('NewClubFunction.executeFunction', {}, 'info');

        // Check prerequirements
        await checkPrerequirements(
            this.parameters,
            this.logger.nextIndent,
            this.auth,
        );

        // Get crypter
        const crypter = new Crypter(cryptionKeys(this.parameters.databaseType));

        // Check if club with identifier already exists
        let clubExists = false;
        (await this.allClubsReference.once('value')).forEach(clubSnapshot => {
            clubExists = clubSnapshot.child('identifier').val() == this.parameters.clubProperties.identifier;
            return clubExists;
        });
        if (clubExists) throw httpsError('already-exists', 'Club identifier already exists', this.logger);

        // Check if club already exists with given id
        if (await existsData(this.clubReference)) return;

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
                [this.parameters.personProperties.id.guidString]: crypter.encodeEncrypt({
                    name: this.parameters.personProperties.name.databaseObject,
                    signInData: {
                        admin: true,
                        userId: this.parameters.personProperties.userId,
                        signInDate: this.parameters.personProperties.signInDate.toISOString(),
                    },
                }),
            },
            listCounts: {
                persons: { total: 1, undeleted: 1 },
                reasonTemplates: { total: 0, undeleted: 0 },
                fines: { total: 0, undeleted: 0 },
            },
        };

        // Set club properties
        await this.clubReference.set(clubProperties, async (error) => {
            if (error != null)
                throw httpsError(
                    'internal',
                    `Couldn't add new club, underlying error: ${error.name}, ${error.message}`,
                    this.logger
                );
        });
    }

    /**
     * Reference to all clubs.
     */
    private get allClubsReference(): admin.database.Reference {
        return reference(
            '',
            this.parameters.databaseType,
            this.logger.nextIndent,
        );
    }

    /**
     * Reference club to be created.
     */
    private get clubReference(): admin.database.Reference {
        return reference(
            this.parameters.clubProperties.id.guidString,
            this.parameters.databaseType,
            this.logger.nextIndent
        );
    }
}

export namespace NewClubFunction {

    /**
     * Parameters of firebase function.
     */
    export interface Parameters {

        /**
         * Private key to check whether the caller is authenticated to use this function
         */
        privateKey: string,

        /**
         * Database type of the change
         */
        databaseType: DatabaseType,

        /**
         * Properties of the club to be created.
         */
        clubProperties: ClubProperties,

        /**
         * Properties of the person creating the club.
         */
        personProperties: PersonPropertiesWithUserId,
    }

    /**
     * Return type of firebase function.
     */
    export type ReturnType = void;
}
