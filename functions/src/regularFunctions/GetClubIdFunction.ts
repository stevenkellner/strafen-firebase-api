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
import { ParameterParser } from '../ParameterParser';

// eslint-disable-next-line valid-jsdoc
/**
 * @summary
 * Get club id with given club identifier.
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - databaseType ({@link DatabaseType}): level of the club (`regular`, `debug`, `testing`)
 *  - identifier (string): identifer of the club to search
 *
 * @return (string): club id of club with given identifer.
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - not-found: if no club with given identifier exists
 */
export class GetClubIdFunction implements IFirebaseFunction<
    GetClubIdFunction.Parameters,
    GetClubIdFunction.ReturnType
> {

    /**
     * Firebase function parameters passed to the firebase function.
     */
    public parameters: GetClubIdFunction.Parameters;

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
            'GetClubIdFunction.constructor',
            { data, auth },
            'notice'
        );
        const parameterContainer = new ParameterContainer(data, this.logger.nextIndent);
        const parameterParser = new ParameterParser<GetClubIdFunction.Parameters>(
            {
                privateKey: 'string',
                databaseType: ['string', DatabaseType.fromString],
                identifier: 'string',
            }, this.logger.nextIndent);
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    /**
     * Executes this firebase function.
     */
    async executeFunction(): Promise<string> {
        this.logger.append('GetClubIdFunction.executeFunction', {}, 'info');

        // Check prerequirements
        await checkPrerequirements(
            this.parameters,
            this.logger.nextIndent,
            this.auth,
        );

        // Get club id
        let clubId: string | null = null;
        (await this.allClubsReference.once('value')).forEach(clubSnapshot => {
            const identifier = clubSnapshot.child('identifier').val();
            if (identifier == this.parameters.identifier)
                clubId = clubSnapshot.key;
            return clubId != null;
        });

        // Return club id
        if (clubId == null) throw httpsError('not-found', 'Club doesn\'t exists.', this.logger);
        return clubId;
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

export namespace GetClubIdFunction {

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
         * Identifier of the club to get id from.
         */
        identifier: string,
    }

    /**
     * Return type of firebase function.
     */
    export type ReturnType = string;
}
