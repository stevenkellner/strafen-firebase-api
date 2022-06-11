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
    Parameters, ReturnType, ParameterParser
> {

    /**
     * All parameters passed by firebase function.
     */
    private parameterContainer: ParameterContainer;

    /**
     * Parser to parse firebase function parameters from parameter container.
     */
    public parameterParser: ParameterParser;

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
        this.parameterContainer = new ParameterContainer(data);
        this.logger = Logger.start(
            this.parameterContainer,
            'GetPersonPropertiesFunction.constructor',
            { data, auth },
            'notice'
        );
        this.parameterParser = new ParameterParser(this.logger.nextIndent);
        this.parameterParser.parseParameters(this.parameterContainer);
    }

    /**
     * Firebase function parameters passed to the firebase function.
     */
    public get parameters(): Parameters {
        return this.parameterParser.parameters;
    }

    /**
     * Executes this firebase function.
     */
    async executeFunction(): Promise<ReturnType> {
        this.logger.append('GetPersonPropertiesFunction.executeFunction', {}, 'info');

        // Check prerequirements
        await checkPrerequirements(
            this.parameterContainer,
            this.logger.nextIndent,
            this.auth,
        );

        // Get person properties
        let properties: ReturnType | null = null;
        (await this.allClubsReference.once('value')).forEach(clubSnapshot => {
            clubSnapshot.child('persons').forEach(personSnapshot => {
                const userId = personSnapshot.child('signInData').child('userId').val();
                if (userId == this.parameters.userId)
                    properties = {
                        personProperties: PersonPropertiesWithIsAdmin.fromObject({
                            id: personSnapshot.key,
                            signInDate: personSnapshot.child('signInData') .child('signInDate').val(),
                            isAdmin: personSnapshot.child('signInData').child('admin').val(),
                            name: {
                                first: personSnapshot.child('name').child('first').val(),
                                last: personSnapshot.child('name').child('last').val(),
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
            this.parameterContainer,
            this.logger.nextIndent
        );
    }
}

/**
 * Parameters of firebase function.
 */
interface Parameters {

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
type ReturnType = {
    personProperties: PersonPropertiesWithIsAdmin.DatabaseObject,
    clubProperties: ClubProperties.DatabaseObject,
}

/**
 * Parser to parse firebase function parameters from parameter container.
 * @template Parameters Type of the fireabse function parameters.
 */
class ParameterParser implements IFirebaseFunction.IParameterParser<Parameters> {

    /**
     * Parsed firebase function parameters from parameter container.
     */
    private initialParameters?: Parameters;

    /**
     * Constructs parser with a logger.
     * @param { Logger } logger Logger to log this class.
     */
    public constructor(private logger: Logger) {}

    /**
     * Parsed firebase function parameters from parameter container.
     */
    public get parameters(): Parameters {
        if (this.initialParameters === undefined)
            throw httpsError(
                'internal',
                'Tried to access parameters before those parameters were parsed.',
                this.logger
            );
        return this.initialParameters;
    }

    /**
     * Parse firebase function parameters from parameter container.
     * @param { ParameterContainer } container Parameter container to parse firebase function parameters from.
     */
    public parseParameters(container: ParameterContainer): void {
        this.logger.append('ParameterParser.parseParameters', { container });

        // Parse parametes
        this.initialParameters = {
            privateKey: container.parameter('privateKey', 'string', this.logger.nextIndent),
            databaseType: container.parameter(
                'databaseType',
                'string',
                this.logger.nextIndent,
                DatabaseType.fromString
            ),
            userId: container.parameter('userId', 'string', this.logger.nextIndent),
        };
    }
}
