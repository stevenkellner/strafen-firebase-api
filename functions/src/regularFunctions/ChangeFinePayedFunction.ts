import * as admin from 'firebase-admin';
import {
    checkPrerequirements,
    IFirebaseFunction,
    httpsError,
    checkUpdateProperties,
    reference,
    Deleted,
} from '../utils';
import { ParameterContainer } from '../ParameterContainer';
import { guid } from '../TypeDefinitions/guid';
import { DatabaseType } from '../TypeDefinitions/DatabaseType';
import { Logger } from '../Logger';
import { AuthData } from 'firebase-functions/lib/common/providers/https';
import {
    IStatisticProperty,
    saveStatistic,
    IStatistic,
} from '../Statistic';
import { Fine } from '../TypeDefinitions/Fine';
import { PayedState } from '../TypeDefinitions/PayedState';
import { ParameterParser } from '../ParameterParser';
import { Updatable, UpdateProperties } from '../TypeDefinitions/Updatable';
import { Crypter } from '../crypter/Crypter';
import { cryptionKeys } from '../privateKeys';

/**
 * @summary
 * Changes payement state of fine with specified fine id.
 *
 * Saved statistik:
 *  - name: changeFinePayed
 *  - properties:
 *      - previousFine ({@link StatisticsFine}}): fine before the change
 *      - changedState ({@link PayedState}): payed state after the change
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - databaseType ({@link DatabaseType}): database type of the change
 *  - clubId ({@link guid}): id of the club to change the fine
 *  - fineId ({@link guid}): id of the fine to change the payed state
 *  - state ({@link PayedState}): new state of the payment of the fine
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - internal: if couldn't change payed state in database
 *    - failed-precondition: if old payed state, reason with reason template id or person for statistik doesn't exist
 */
export class ChangeFinePayedFunction implements IFirebaseFunction<
    ChangeFinePayedFunction.Parameters,
    ChangeFinePayedFunction.ReturnType
> {

    /**
     * Firebase function parameters passed to the firebase function.
     */
    public parameters: ChangeFinePayedFunction.Parameters;

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
            'ChangeFinePayedFunction.constructor',
            { data, auth },
            'notice'
        );
        const parameterContainer = new ParameterContainer(data, this.logger.nextIndent);
        const parameterParser = new ParameterParser<ChangeFinePayedFunction.Parameters>(
            {
                privateKey: 'string',
                databaseType: ['string', DatabaseType.fromString],
                clubId: ['string', guid.fromString],
                fineId: ['string', guid.fromString],
                payedState: ['object', PayedState.fromObject],
                fineUpdateProperties: ['object', UpdateProperties.fromObject],
            },
            this.logger.nextIndent);
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    /**
     * Executes this firebase function.
     */
    async executeFunction() {
        this.logger.append('ChangeFinePayedFunction.executeFunction', {}, 'info');

        // Check prerequirements
        await checkPrerequirements(
            this.parameters,
            this.logger.nextIndent,
            this.auth,
            this.parameters.clubId
        );

        // Get crypter
        const crypter = new Crypter(cryptionKeys(this.parameters.databaseType));

        // Get previous fine
        const fineSnapshot = await this.fineReference.once('value');
        let previousFine: Updatable<Fine | Deleted<guid>> | undefined;
        if (fineSnapshot.exists()) {
            previousFine = Updatable.fromRawProperty(
                {
                    id: fineSnapshot.key,
                    ...crypter.decryptDecode(fineSnapshot.val()),
                },
                Fine.fromObject,
                this.logger.nextIndent,
            );
        }

        // Check update timestamp
        checkUpdateProperties(
            previousFine?.updateProperties,
            this.parameters.fineUpdateProperties,
            this.parameters.databaseType,
            this.logger.nextIndent,
        );


        if (!(previousFine?.property instanceof Fine))
            throw httpsError('unavailable', 'Couldn\'t get fine from \'Deleted\'.', this.logger);

        // Get statistics fine
        const statisticsFine = await previousFine.property.statistic(
            this.parameters.clubId,
            this.parameters.databaseType,
            this.logger.nextIndent
        );

        // Set payed state
        previousFine.property.payedState = this.parameters.payedState;
        await this.fineReference.set(crypter.encodeEncrypt(previousFine.databaseObject), error => {
            if (error != null)
                throw httpsError(
                    'internal',
                    `Couldn't update payed state, underlying error: ${error.name}, ${error.message}`,
                    this.logger
                );
        });

        // Save statistic
        await saveStatistic(
            new ChangeFinePayedFunction.Statistic(
                new ChangeFinePayedFunction.StatisticProperty(
                    statisticsFine,
                    this.parameters.payedState
                )
            ),
            this.parameters,
            this.logger.nextIndent,
        );
    }

    /**
     * Reference to the fine of payed state.
     */
    private get fineReference(): admin.database.Reference {
        return reference(
            `${this.parameters.clubId.guidString}/fines/${this.parameters.fineId.guidString}`,
            this.parameters.databaseType,
            this.logger.nextIndent
        );
    }
}

export namespace ChangeFinePayedFunction {

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
         * Id of the club to change the payed state
         */
        clubId: guid,

        /**
         * Id of fine of the payed state.
         */
        fineId: guid,

        /**
         * Payed state to change
         */
        payedState: PayedState,

        /**
         * Update properties of fine of the payed state.
         */
        fineUpdateProperties: UpdateProperties,
    }

    /**
     * Return type of firebase function.
     */
    export type ReturnType = void;

    /**
     * Statistic of this firebase function that will be stored in the database.
     */
    export class Statistic implements IStatistic<StatisticProperty> {

        /**
         * Identifier of the statistic of a database update.
         */
        readonly identifier: string = 'changeFinePayed';

        /**
         * Constructs Statistic with statistic property.
         * @param { StatisticProperty } property Property of the statistic of a database update.
         */
        constructor(readonly property: StatisticProperty) { }
    }

    /**
     * Statistic property of this firebase function that will be stored in the database.
     */
    export class StatisticProperty implements IStatisticProperty<StatisticProperty.DatabaseObject> {

        /**
         * Constructs statistic with previous fine and changed payed state
         * @param { Fine.Statistic } previousFine Previous fine before change.
         * @param { PayedState } changedState Changed payed state after change.
         */
        public constructor(
            public readonly previousFine: Fine.Statistic,
            public readonly changedState: PayedState
        ) { }

        /**
         * Statistic property object that will be stored in the database.
         */
        public get databaseObject(): StatisticProperty.DatabaseObject {
            return {
                previousFine: this.previousFine?.databaseObject ?? null,
                changedState: this.changedState?.databaseObject ?? null,
            };
        }
    }

    export namespace StatisticProperty {

        /**
         * Statistic property object that will be stored in the database.
         */
        export interface DatabaseObject {

            /**
             * Previous fine before change.
             */
            previousFine: Fine.Statistic.DatabaseObject | null;

            /**
             * Changed payed state after change.
             */
            changedState: PayedState.DatabaseObject | null;
        }
    }
}
