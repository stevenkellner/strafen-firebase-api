import * as admin from 'firebase-admin';
import {
    checkPrerequirements,
    IFirebaseFunction,
    httpsError,
    reference,
} from '../utils';
import { ParameterContainer } from '../ParameterContainer';
import { guid } from '../TypeDefinitions/guid';
import { DatabaseType } from '../TypeDefinitions/DatabaseType';
import { Logger } from '../Logger';
import { AuthData } from 'firebase-functions/lib/common/providers/https';
import { ClubProperties } from '../TypeDefinitions/ClubProperties';
import { PersonPropertiesWithUserId } from '../TypeDefinitions/PersonPropertiesWithUserId';
import { ParameterParser } from '../ParameterParser';
import { Crypter } from '../crypter/Crypter';
import { cryptionKeys } from '../privateKeys';

// eslint-disable-next-line valid-jsdoc
/**
 * @summary
 * Register person to club with given club id.
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - databaseType ({@link DatabaseType}): level of the club (`regular`, `debug`, `testing`)
 *  - clubId ({@link} guid): id of the club to register the person
 *  - personProperties ({@link PersonPropertiesWithUserId}): properties of the person signed in
 *
 * @return
 *  - ...({@link ClubProperties.ServerObject}): properties of club
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - internal: if couldn't create person in database
 */
export class RegisterPersonFunction implements IFirebaseFunction<
    RegisterPersonFunction.Parameters,
    RegisterPersonFunction.ReturnType
> {

    /**
     * Firebase function parameters passed to the firebase function.
     */
    public parameters: RegisterPersonFunction.Parameters;

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
            'RegisterPersonFunction.constructor',
            { data, auth },
            'notice'
        );
        const parameterContainer = new ParameterContainer(data, this.logger.nextIndent);
        const parameterParser = new ParameterParser<RegisterPersonFunction.Parameters>(
            {
                privateKey: 'string',
                databaseType: DatabaseType.buildProperties,
                clubId: guid.buildProperties,
                personProperties: PersonPropertiesWithUserId.buildProperties,
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    /**
     * Executes this firebase function.
     */
    async executeFunction(): Promise<RegisterPersonFunction.ReturnType> {
        this.logger.append('RegisterPersonFunction.executeFunction', {}, 'info');

        // Check prerequirements
        await checkPrerequirements(
            this.parameters.databaseType,
            this.parameters.privateKey,
            this.logger.nextIndent,
            this.auth,
        );

        // Get crypter
        const crypter = new Crypter(cryptionKeys(this.parameters.databaseType));

        // Get person properties
        const person = {
            name: this.parameters.personProperties.name,
            signInData: {
                admin: false,
                userId: this.parameters.personProperties.userId,
                signInDate: this.parameters.personProperties.signInDate.toISOString(),
            },
        };

        // Register person
        await this.personReference.set(crypter.encodeEncrypt(person), error => {
            if (error != null)
                throw httpsError('internal', 'Couldn\'t register person to database (1).', this.logger);
        });
        await this.personUserIdReference.set(this.parameters.personProperties.id.guidString, error => {
            if (error != null)
                throw httpsError('internal', 'Couldn\'t register person to database (2).', this.logger);
        });

        // Get club properties to return
        const clubSnapshot = await this.clubReference.once('value');
        const clubProperties = ClubProperties.fromObject({
            id: clubSnapshot.key,
            name: clubSnapshot.child('name').val(),
            identifier: clubSnapshot.child('identifier').val(),
            regionCode: clubSnapshot.child('regionCode').val(),
            inAppPaymentActive: clubSnapshot.child('inAppPaymentActive').val(),
        }, this.logger.nextIndent);

        return clubProperties.databaseObject;
    }

    /**
     * Reference to the club the person will be registered.
     */
    private get clubReference(): admin.database.Reference {
        return reference(
            `${this.parameters.clubId.guidString}`,
            this.parameters.databaseType,
            this.logger.nextIndent
        );
    }

    /**
     * Reference to the person to register.
     */
    private get personReference(): admin.database.Reference {
        return reference(
            `${this.parameters.clubId.guidString}/persons/${this.parameters.personProperties.id.guidString}`,
            this.parameters.databaseType,
            this.logger.nextIndent
        );
    }

    /**
     * Reference to user id of the person to register.
     */
    private get personUserIdReference(): admin.database.Reference {
        return reference(
            `${this.parameters.clubId.guidString}/personUserIds/${this.parameters.personProperties.userId}`,
            this.parameters.databaseType,
            this.logger.nextIndent
        );
    }
}

export namespace RegisterPersonFunction {

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
         * Id of the club to change the person
         */
        clubId: guid,

        /**
         * Properties of person to register.
         */
        personProperties: PersonPropertiesWithUserId,
    }

    /**
     * Return type of firebase function.
     */
    export type ReturnType = ClubProperties.DatabaseObject;
}
