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

// eslint-disable-next-line valid-jsdoc
/**
 * @summary
 * Checks if club with given identifier already exists.
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - databaseType ({@link DatabaseType}): database type
 *  - identifier (string): identifer of the club to search
 *
 * @return (boolean): `true` if a club with given identifier already exists, `false` otherwise
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 */
export class ExistsClubWithIdentifierFunction implements IFirebaseFunction<
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
            'ExistsClubWithIdentifierFunction.constructor',
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
    async executeFunction(): Promise<boolean> {
        this.logger.append('ExistsClubWithIdentifierFunction.executeFunction', {}, 'info');

        // Check prerequirements
        await checkPrerequirements(
            this.parameterContainer,
            this.logger.nextIndent,
            this.auth,
        );

        // Check if club identifier exists
        let clubExists = false;
        (await this.allClubsReference.once('value')).forEach(clubSnapshot => {
            clubExists = clubSnapshot.child('identifier').val() == this.parameters.identifier;
            return clubExists;
        });
        return clubExists;
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
     * Identifier of the club to check existence.
     */
    identifier: string,
}

/**
 * Return type of firebase function.
 */
type ReturnType = boolean;

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
            identifier: container.parameter('identifier', 'string', this.logger.nextIndent),
        };
    }
}
