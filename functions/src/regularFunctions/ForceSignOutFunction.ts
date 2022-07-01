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
import { ParameterParser } from '../ParameterParser';
import { Crypter } from '../crypter/Crypter';
import { cryptionKeys } from '../privateKeys';

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
    ForceSignOutFunction.Parameters,
    ForceSignOutFunction.ReturnType
> {

    /**
     * Firebase function parameters passed to the firebase function.
     */
    public parameters: ForceSignOutFunction.Parameters;

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
            'ForceSignOutFunction.constructor',
            { data, auth },
            'notice'
        );
        const parameterContainer = new ParameterContainer(data, this.logger.nextIndent);
        const parameterParser = new ParameterParser<ForceSignOutFunction.Parameters>(
            {
                privateKey: 'string',
                databaseType: ['string', DatabaseType.fromString],
                clubId: ['string', guid.fromString],
                personId: ['string', guid.fromString],
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    /**
     * Executes this firebase function.
     */
    async executeFunction(): Promise<void> {
        this.logger.append('ForceSignOutFunction.executeFunction', {}, 'info');

        // Check prerequirements
        await checkPrerequirements(
            this.parameters,
            this.logger.nextIndent,
            this.auth,
        );

        // Get person
        const crypter = new Crypter(cryptionKeys(this.parameters.databaseType));
        const personSnapshot = await this.personReference.once('value');
        const person = crypter.decryptDecode(personSnapshot.val());

        // Check if person is signed in
        if (person.signInData === undefined) return;

        // Get user id
        const userId = person.signInData.userId;
        if (typeof userId !== 'string')
            throw httpsError('internal', 'No valid user id in sign in data.', this.logger);

        // Delete sign in data
        person.signInData = undefined;
        await this.personReference.set(crypter.encodeEncrypt(person), error => {
            if (error != null)
                throw httpsError(
                    'internal',
                    `Couldn't set person, underlying error: ${error.name}, ${error.message}`,
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
    private get personReference(): admin.database.Reference {
        return reference(
            `${this.parameters.clubId.guidString}/persons/${this.parameters.personId.guidString}`,
            this.parameters.databaseType,
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
            this.parameters.databaseType,
            this.logger.nextIndent
        );
    }
}

export namespace ForceSignOutFunction {

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
    export type ReturnType = void;
}
