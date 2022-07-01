import * as admin from 'firebase-admin';
import {
    checkPrerequirements,
    IFirebaseFunction,
    existsData,
    httpsError,
    reference,
} from '../utils';
import { ParameterContainer } from '../ParameterContainer';
import { DatabaseType } from '../TypeDefinitions/DatabaseType';
import { Logger } from '../Logger';
import { AuthData } from 'firebase-functions/lib/common/providers/https';
import { ParameterParser } from '../ParameterParser';

// eslint-disable-next-line require-jsdoc
export class DeleteTestClubsFunction implements IFirebaseFunction<
    DeleteTestClubsFunction.Parameters,
    DeleteTestClubsFunction.ReturnType
> {

    /**
     * Firebase function parameters passed to the firebase function.
     */
    public parameters: DeleteTestClubsFunction.Parameters;

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
            'DeleteTestClubsFunction.constructor',
            { data, auth },
            'notice'
        );
        const parameterContainer = new ParameterContainer(data, this.logger.nextIndent);
        const parameterParser = new ParameterParser<DeleteTestClubsFunction.Parameters>(
            {
                privateKey: 'string',
                databaseType: ['string', DatabaseType.fromString],
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    /**
     * Execute this firebase function.
     */
    async executeFunction(): Promise<DeleteTestClubsFunction.ReturnType> {
        this.logger.append('DeleteTestClubsFunction.executeFunction', {}, 'info');
        await checkPrerequirements(
            this.parameters,
            this.logger.nextIndent,
            this.auth
        );
        if (this.parameters.databaseType.value !== 'testing')
            throw httpsError('failed-precondition', 'Function can only be called for testing.', this.logger);
        if (await existsData(this.allClubsReference))
            this.allClubsReference.remove(error => {
                if (error != null) throw error;
            });
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

export namespace DeleteTestClubsFunction {

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
    }

    /**
     * Return type of firebase function.
     */
    export type ReturnType = void;
}
