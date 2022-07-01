import * as admin from 'firebase-admin';
import {
    checkPrerequirements,
    IFirebaseFunction,
    existsData,
    httpsError,
    checkUpdateProperties,
    Deleted,
    reference,
} from '../utils';
import { ParameterContainer } from '../ParameterContainer';
import { guid } from '../TypeDefinitions/guid';
import { DatabaseType } from '../TypeDefinitions/DatabaseType';
import { ChangeType } from '../TypeDefinitions/ChangeType';
import { Logger } from '../Logger';
import { Updatable } from '../TypeDefinitions/Updatable';
import { AuthData } from 'firebase-functions/lib/common/providers/https';
import {
    IStatisticProperty,
    saveStatistic,
    IStatistic,
} from '../Statistic';
import { LatePaymentInterest } from '../TypeDefinitions/LatePaymentInterest';
import { ParameterParser } from '../ParameterParser';
import { Crypter } from '../crypter/Crypter';
import { cryptionKeys } from '../privateKeys';

/**
 * @summary
 * Changes the late payment interest of club with given club id.
 *
 * Saved statistik:
 *  - name: changeLatePaymentInterest
 *  - properties:
 *      - previousInterest ({@link LatePaymentInterest} | null): Previous late payment interest
 *      - changedInterest ({@link LatePaymentInterest} | null): Changed late payment interest or null if
 *          change type is `delete`
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - databaseType ({@link DatabaseType}}): level of the club (`regular`, `debug`, `testing`)
 *  - clubId ({@link guid}): id of the club to change the late payment interest
 *  - changeType ({@link ChangeType}}): type of the change (`update`, `delete`)
 *  - latePaymentInterest ({@link Updatable}<{@link LatePaymentInterest} | {@link Deleted}>): interest to change
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - internal: if couldn't change interest in database
 */
export class ChangeLatePaymentInterestFunction implements IFirebaseFunction<
    ChangeLatePaymentInterestFunction.Parameters,
    ChangeLatePaymentInterestFunction.ReturnType
> {

    /**
     * Firebase function parameters passed to the firebase function.
     */
    public parameters: ChangeLatePaymentInterestFunction.Parameters;

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
            'ChangeLatePaymentInterestFunction.constructor',
            { data, auth },
            'notice'
        );
        const parameterContainer = new ParameterContainer(data, this.logger.nextIndent);
        const parameterParser = new ParameterParser<ChangeLatePaymentInterestFunction.Parameters>(
            {
                privateKey: 'string',
                databaseType: ['string', DatabaseType.fromString],
                clubId: ['string', guid.fromString],
                changeType: ['string', ChangeType.fromString],
                updatableInterest: ['object', (value: object, logger: Logger) =>
                    Updatable.fromRawProperty(value, LatePaymentInterest.fromObject, logger),
                ],
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
        this.logger.append('ChangeLatePaymentInterestFunction.executeFunction', {}, 'info');

        // Check prerequirements
        await checkPrerequirements(
            this.parameters,
            this.logger.nextIndent,
            this.auth,
            this.parameters.clubId,
        );

        // Get crypter
        const crypter = new Crypter(cryptionKeys(this.parameters.databaseType));

        // Get previous interest
        const interestSnapshot = await this.interestReference.once('value');
        let previousInterest: Updatable<LatePaymentInterest | Deleted<null>> | undefined;
        if (interestSnapshot.exists()) {
            previousInterest = Updatable.fromRawProperty(
                crypter.decryptDecode(interestSnapshot.val()),
                LatePaymentInterest.fromObject,
                this.logger.nextIndent,
            );
        }

        // Check update timestamp
        checkUpdateProperties(
            previousInterest?.updateProperties,
            this.parameters.updatableInterest.updateProperties,
            this.parameters.databaseType,
            this.logger.nextIndent,
        );

        // Change interest
        let changedInterest: LatePaymentInterest | undefined;
        switch (this.parameters.changeType.value) {
        case 'delete':
            await this.deleteItem();
            break;

        case 'update':
            await this.updateItem();
            changedInterest = this.parameters.updatableInterest.property as LatePaymentInterest;
            break;
        }

        // Save statistic
        await saveStatistic(
            new ChangeLatePaymentInterestFunction.Statistic(
                new ChangeLatePaymentInterestFunction.StatisticProperty(previousInterest?.property, changedInterest)
            ),
            this.parameters,
            this.logger.nextIndent,
        );
    }

    /**
     * Reference to the person to change.
     */
    private get interestReference(): admin.database.Reference {
        return reference(
            `${this.parameters.clubId.guidString}/latePaymentInterest`,
            this.parameters.databaseType,
            this.logger.nextIndent
        );
    }

    /**
     * Deletes late payment interest.
     */
    private async deleteItem(): Promise<void> {
        this.logger.append('ChangePersonFunction.deleteItem');
        const crypter = new Crypter(cryptionKeys(this.parameters.databaseType));

        // Check if parameters is valid for deleting.
        if (!(this.parameters.updatableInterest.property instanceof Deleted))
            throw httpsError(
                'invalid-argument',
                'LatePaymentInterest property isn\'t from type \'Deleted\'.',
                this.logger
            );

        // Delete item.
        if (await existsData(this.interestReference)) {
            await this.interestReference.set(crypter.encodeEncrypt(this.parameters.updatableInterest.databaseObject),
                error => {
                    if (error != null)
                        throw httpsError('internal',
                            `Couldn't delete late payment interest, underlying error: ${error.name}, ${error.message}`,
                            this.logger
                        );
                }
            );
        }
    }

    /**
     * Updates late payment interest.
     */
    private async updateItem(): Promise<ChangeLatePaymentInterestFunction.ReturnType> {
        this.logger.append('ChangeLatePaymentInterestFunction.updateItem');
        const crypter = new Crypter(cryptionKeys(this.parameters.databaseType));

        // Check if parameters is valid for updating.
        if (!(this.parameters.updatableInterest.property instanceof LatePaymentInterest))
            throw httpsError(
                'invalid-argument',
                'LatePaymentInterest property isn\'t from type \'LatePaymentInterest\'.',
                this.logger
            );

        // Set updated item.
        await this.interestReference.set(crypter.encodeEncrypt(this.parameters.updatableInterest.databaseObject),
            error => {
                if (error !== null)
                    throw httpsError(
                        'internal',
                        `Couldn't update late payment interest, underlying error: ${error.name}, ${error.message}`,
                        this.logger
                    );
            }
        );
    }
}

export namespace ChangeLatePaymentInterestFunction {

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
         * Id of the club to change the late payment interest
         */
        clubId: guid,

        /**
         * Type of the change
         */
        changeType: ChangeType,

        /**
         * Late payment interest to change
         */
        updatableInterest: Updatable<LatePaymentInterest | Deleted<null>>
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
        readonly identifier: string = 'changeLatePaymentInterest';

        /**
         * Constructs Statistic with statistic property.
         * @param { StatisticProperty } property Property of the statistic of a database update.
         */
        constructor(readonly property: StatisticProperty) {}
    }

    /**
     * Statistic property of this firebase function that will be stored in the database.
     */
    export class StatisticProperty implements IStatisticProperty<StatisticProperty.DatabaseObject> {

        /**
         * Constructs statistic with previous and changed late payment interest
         * @param { LatePaymentInterest | null } previousInterest Previous late payment interest before change.
         * @param { LatePaymentInterest | null } changedInterest Changed late payment interest after change.
         */
        public constructor(
            public readonly previousInterest: LatePaymentInterest | Deleted<null> | undefined,
            public readonly changedInterest: LatePaymentInterest | undefined
        ) {}

        /**
         * Statistic property object that will be stored in the database.
         */
        public get databaseObject(): StatisticProperty.DatabaseObject {
            const previousInterest = this.previousInterest instanceof LatePaymentInterest ?
                this.previousInterest?.databaseObject ?? null : null;
            return {
                previousInterest: previousInterest,
                changedInterest: this.changedInterest?.databaseObject ?? null,
            };
        }
    }

    export namespace StatisticProperty {

        /**
         * Statistic property object that will be stored in the database.
         */
        export interface DatabaseObject {

            /**
             * Previous late payment interest before change.
             */
            previousInterest: LatePaymentInterest.DatabaseObject | null;

            /**
             * Changed late payment interest after change.
             */
            changedInterest: LatePaymentInterest.DatabaseObject | null;
        }
    }
}
