import * as admin from 'firebase-admin';
import {
    checkPrerequirements,
    IFirebaseFunction,
    httpsError,
    reference,
} from '../utils';
import { ParameterContainer } from '../ParameterContainer';
import { DatabaseType } from '../TypeDefinitions/DatabaseType';
import { Logger } from '../Logger';
import { AuthData } from 'firebase-functions/lib/common/providers/https';
import { ClubProperties } from '../TypeDefinitions/ClubProperties';
import { PersonPropertiesWithIsAdmin } from '../TypeDefinitions/PersonPropertiesWithIsAdmin';
import { ParameterParser } from '../ParameterParser';
import { Crypter } from '../crypter/Crypter';
import { cryptionKeys } from '../privateKeys';

// eslint-disable-next-line valid-jsdoc
/**
 * @summary
 * Returns club and person properties of user id.
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - databaseType ({@link DatabaseType}): level of the club (`regular`, `debug`, `testing`)
 *  - userId (string): user id to search in database
 *
 * @return:
 *  - personProperties ({@link PersonProperties.ServerObject}) properties of person with specified user id
 *  - clubProperties ({@link ClubProperties.ServerObject}) properties of club
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - not-found: if no person with given user id was found
 */
export class GetPersonPropertiesFunction implements IFirebaseFunction<
    GetPersonPropertiesFunction.Parameters,
    GetPersonPropertiesFunction.ReturnType
> {

    /**
     * Firebase function parameters passed to the firebase function.
     */
    public parameters: GetPersonPropertiesFunction.Parameters;

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
            'GetPersonPropertiesFunction.constructor',
            { data, auth },
            'notice'
        );
        const parameterContainer = new ParameterContainer(data, this.logger.nextIndent);
        const parameterParser = new ParameterParser<GetPersonPropertiesFunction.Parameters>(
            {
                privateKey: 'string',
                databaseType: ['string', DatabaseType.fromString],
                userId: 'string',
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    /**
     * Executes this firebase function.
     */
    async executeFunction(): Promise<GetPersonPropertiesFunction.ReturnType> {
        this.logger.append('GetPersonPropertiesFunction.executeFunction', {}, 'info');

        // Check prerequirements
        await checkPrerequirements(
            this.parameters,
            this.logger.nextIndent,
            this.auth,
        );

        // Get person properties
        const crypter = new Crypter(cryptionKeys(this.parameters.databaseType));
        let properties: GetPersonPropertiesFunction.ReturnType | null = null;
        (await this.allClubsReference.once('value')).forEach(clubSnapshot => {
            clubSnapshot.child('persons').forEach(personSnapshot => {
                const person = crypter.decryptDecode(personSnapshot.val());
                const userId = person.signInData?.userId;
                if (userId == this.parameters.userId)
                    properties = {
                        personProperties: PersonPropertiesWithIsAdmin.fromObject({
                            id: personSnapshot.key,
                            signInDate: person.signInData.signInDate,
                            isAdmin: person.signInData.admin,
                            name: {
                                first: person.name.first,
                                last: person.name.last,
                            },
                        }, this.logger.nextIndent).databaseObject,
                        clubProperties: ClubProperties.fromObject({
                            id: clubSnapshot.key,
                            name: clubSnapshot.child('name').val(),
                            identifier: clubSnapshot.child('identifier').val(),
                            regionCode: clubSnapshot.child('regionCode').val(),
                            inAppPaymentActive: clubSnapshot.child('inAppPaymentActive').val(),
                        }, this.logger.nextIndent).databaseObject,
                    };
                return properties != null;
            });
            return properties != null;
        });

        // Return person properties
        if (properties === null)
            throw httpsError('not-found', 'Person doesn\'t exist.', this.logger);
        return properties;
    }

    /**
     * Reference to all clubs.
     */
    private get allClubsReference(): admin.database.Reference {
        return reference(
            '',
            this.parameters.databaseType,
            this.logger.nextIndent
        );
    }
}

export namespace GetPersonPropertiesFunction {

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
         * User id of person to get properties from
         */
        userId: string,
    }

    /**
     * Return type of firebase function.
     */
    export type ReturnType = {
        personProperties: PersonPropertiesWithIsAdmin.DatabaseObject,
        clubProperties: ClubProperties.DatabaseObject,
    }
}
