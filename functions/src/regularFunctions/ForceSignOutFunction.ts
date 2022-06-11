import * as admin from 'firebase-admin';
import {
    checkPrerequirements,
    IFirebaseFunction,
    existsData,
    httpsError,
    reference,
} from '../utils';
import { ParameterContainer } from '../ParameterContainer';
import { guid } from '../TypeDefinitions/guid';
import { DatabaseType } from '../TypeDefinitions/DatabaseType';
import { Logger } from '../Logger';
import { AuthData } from 'firebase-functions/lib/common/providers/https';

/**
 * @summary
 * Force sign out a person.
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - databaseType ({@link DatabaseType}): level of the club (`regular`, `debug`, `testing`)
 *  - clubId ({@link guid}): id of the club to force sign out the person
 *  - personId ({@link guid}): id of person to be force signed out
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - internal: if an error occurs while force sign out the person in database
 */
export class ForceSignOutFunction implements IFirebaseFunction<
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
            'ForceSignOutFunction.constructor',
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
    async executeFunction(): Promise<void> {
        this.logger.append('ForceSignOutFunction.executeFunction', {}, 'info');

        // Check prerequirements
        await checkPrerequirements(
            this.parameterContainer,
            this.logger.nextIndent,
            this.auth,
            this.parameters.clubId
        );

        // Check if person is signed in
        if (!(await existsData(this.signInDataReference))) return;

        // Get user id
        const userIdSnapshot = await this.signInDataReference.child('userId').once('value');
        if (!userIdSnapshot.exists() || typeof userIdSnapshot.val() !== 'string')
            throw httpsError('internal', 'No valid user id in sign in data.', this.logger);
        const userId: string = userIdSnapshot.val();

        // Delete sign in data
        await this.signInDataReference.remove(error => {
            if (error != null)
                throw httpsError(
                    'internal',
                    `Couldn't delete sign in data, underlying error: ${error.name}, ${error.message}`,
                    this.logger
                );
        });

        // Delete user id in personUserIds
        if (await existsData(this.personUserIdReference(userId))) {
            await this.personUserIdReference(userId).remove((error) => {
                if (error != null)
                    throw httpsError(
                        'internal',
                        `Couldn't delete person user id, underlying error: ${error.name}, ${error.message}`,
                        this.logger
                    );
            });
        }
    }

    /**
     * Reference to the sign in data of the person to force sign out.
     */
    private get signInDataReference(): admin.database.Reference {
        return reference(
            `${this.parameters.clubId.guidString}/persons/${this.parameters.personId.guidString}/signInData`,
            this.parameterContainer,
            this.logger.nextIndent
        );
    }

    /**
     * Reference to the person user id of the person to force sign out.
     * @param { string } userId User id of the person to force sign out.
     * @return { admin.database.Reference } Reference to the person user id of the person to force sign out.
     */
    private personUserIdReference(userId: string): admin.database.Reference {
        return reference(
            `${this.parameters.clubId.guidString}/personUserIds/${userId}`,
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
     * Id of the club to force sign out the person.
     */
    clubId: guid,

    /**
     * Id of the person to force sign out
     */
    personId: guid,
}

/**
 * Return type of firebase function.
 */
type ReturnType = void;

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
            clubId: container.parameter('clubId', 'string', this.logger.nextIndent, guid.fromString),
            personId: container.parameter('personId', 'string', this.logger.nextIndent, guid.fromString),
        };
    }
}
