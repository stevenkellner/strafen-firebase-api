import * as admin from 'firebase-admin';
import {
    checkPrerequirements,
    IFirebaseFunction,
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
 * Checks if a person with given user id exists.
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - databaseType ({@link DatabaseType}): level of the club (`regular`, `debug`, `testing`)
 *  - userId (string): user id to search in database
 *
 * @return (boolean): `true`if a person with given user id exists
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 */
export class ExistsPersonWithUserIdFunction implements IFirebaseFunction<
    ExistsPersonWithUserIdFunction.Parameters,
    ExistsPersonWithUserIdFunction.ReturnType
> {

    /**
     * Firebase function parameters passed to the firebase function.
     */
    public parameters: ExistsPersonWithUserIdFunction.Parameters;

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
            'ExistsPersonWithUserIdFunction.constructor',
            { data, auth },
            'notice'
        );
        const parameterContainer = new ParameterContainer(data, this.logger.nextIndent);
        const parameterParser = new ParameterParser<ExistsPersonWithUserIdFunction.Parameters>(
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
    async executeFunction(): Promise<boolean> {
        this.logger.append('ExistsPersonWithUserIdFunction.executeFunction', {}, 'info');

        // Check prerequirements
        await checkPrerequirements(
            this.parameters,
            this.logger.nextIndent,
            this.auth,
        );

        // Check if person exists
        let personExists = false;
        (await this.allClubsReference.once('value')).forEach(clubSnapshot => {
            personExists = clubSnapshot.child('personUserIds').child(this.parameters.userId).exists();
            return personExists;
        });
        return personExists;
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

export namespace ExistsPersonWithUserIdFunction {

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
         * User id of person to check if exitsts
         */
        userId: string
    }

    /**
     * Return type of firebase function.
     */
    export type ReturnType = boolean;
}
