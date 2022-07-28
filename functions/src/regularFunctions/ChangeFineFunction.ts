import * as admin from 'firebase-admin';
import {
    checkPrerequirements,
    IFirebaseFunction,
    existsData,
    httpsError,
    checkUpdateProperties,
    Deleted,
    reference, getCountUpdate,
} from '../utils';
import { ParameterContainer } from '../ParameterContainer';
import { guid } from '../TypeDefinitions/guid';
import { DatabaseType } from '../TypeDefinitions/DatabaseType';
import { ChangeType } from '../TypeDefinitions/ChangeType';
import { Fine } from '../TypeDefinitions/Fine';
import { Logger } from '../Logger';
import { Updatable } from '../TypeDefinitions/Updatable';
import { AuthData } from 'firebase-functions/lib/common/providers/https';
import {
    IStatisticProperty,
    saveStatistic,
    IStatistic,
} from '../Statistic';
import { ParameterParser } from '../ParameterParser';
import { Crypter } from '../crypter/Crypter';
import { cryptionKeys } from '../privateKeys';

/**
 * @summary
 * Changes a element of fine list.
 *
 * Saved statistik:
 *  - name: changeFine
 *  - properties:
 *      - previousFine ({@link StatisticsFine} | null): Previous fine to change
 *      - changedFine ({@link StatisticsFine} | null): Changed fine or null if change type is `delete`
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - databaseType ({@link DatabaseType}): database type of the change
 *  - clubId ({@link guid}): id of the club to change the fine
 *  - changeType ({@link ChangeType}}): type of the change
 *  - fine ({@link Updatable}<{@link Fine} | {@link Deleted}>): fine to change
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - internal: if couldn't change fine in database
 */
export class ChangeFineFunction implements IFirebaseFunction<
    ChangeFineFunction.Parameters,
    ChangeFineFunction.ReturnType
> {

    /**
     * Firebase function parameters passed to the firebase function.
     */
    public parameters: ChangeFineFunction.Parameters;

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
            'ChangeFineFunction.constructor',
            { data, auth },
            'notice'
        );
        const parameterContainer = new ParameterContainer(data, this.logger.nextIndent);
        const parameterParser = new ParameterParser<ChangeFineFunction.Parameters>(
            {
                privateKey: 'string',
                databaseType: ['string', DatabaseType.fromString],
                clubId: ['string', guid.fromString],
                changeType: ['string', ChangeType.fromString],
                updatableFine: ['object', (value: object, logger: Logger) =>
                    Updatable.fromRawProperty(value, Fine.fromObject, logger),
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
        this.logger.append('ChangeFineFunction.executeFunction', {}, 'info');

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
            this.parameters.updatableFine.updateProperties,
            this.parameters.databaseType,
            this.logger.nextIndent,
        );

        // Change fine
        let changedFine: Fine.Statistic | undefined;
        switch (this.parameters.changeType.value) {
        case 'delete':
            await this.deleteItem();
            break;

        case 'update':
            await this.updateItem();
            changedFine = await (this.parameters.updatableFine.property as Fine).statistic(
                this.parameters.clubId,
                this.parameters.databaseType,
                this.logger.nextIndent,
            );
            break;
        }

        // Change count
        const countUpdate = getCountUpdate(previousFine, this.parameters.changeType);
        const finesCountSnapshot = await this.countReference.once('value');
        if (!finesCountSnapshot.exists) throw httpsError('internal', 'Couldn\'t get list count.', this.logger);
        const finesCount: { total: number, undeleted: number } = finesCountSnapshot.val();
        await this.countReference.set({
            total: finesCount.total + countUpdate.total,
            undeleted: finesCount.undeleted + countUpdate.undeleted,
        });

        // Save statistic
        const previousFineStatisist = previousFine?.property instanceof Fine ?
            await previousFine.property.statistic(
                this.parameters.clubId,
                this.parameters.databaseType,
                this.logger.nextIndent,
            ) : undefined;
        await saveStatistic(
            new ChangeFineFunction.Statistic(
                new ChangeFineFunction.StatisticProperty(previousFineStatisist, changedFine)
            ),
            this.parameters,
            this.logger.nextIndent,
        );
    }

    /**
     * Reference to the fine to change.
     */
    private get fineReference(): admin.database.Reference {
        return reference(
            `${this.parameters.clubId.guidString}/fines/${this.parameters.updatableFine.property.id.guidString}`,
            this.parameters.databaseType,
            this.logger.nextIndent
        );
    }

    /**
     * Reference to fines fount.
     */
    private get countReference(): admin.database.Reference {
        return reference(
            `${this.parameters.clubId.guidString}/listCounts/fines`,
            this.parameters.databaseType,
            this.logger.nextIndent
        );
    }

    /**
     * Deletes person.
     */
    private async deleteItem(): Promise<void> {
        this.logger.append('ChangePersonFunction.deleteItem');
        const crypter = new Crypter(cryptionKeys(this.parameters.databaseType));

        // Check if parameters is valid for deleting.
        if (!(this.parameters.updatableFine.property instanceof Deleted))
            throw httpsError(
                'invalid-argument',
                'Fine property isn\'t from type \'Deleted\'.',
                this.logger
            );

        // Delete item.
        if (await existsData(this.fineReference)) {
            await this.fineReference.set(crypter.encodeEncrypt(this.parameters.updatableFine.databaseObject),
                error => {
                    if (error != null)
                        throw httpsError('internal',
                            `Couldn't delete fine, underlying error: ${error.name}, ${error.message}`,
                            this.logger
                        );
                }
            );
        }
    }

    /**
     * Updates fine.
     */
    private async updateItem(): Promise<void> {
        this.logger.append('ChangeFineFunction.updateItem');
        const crypter = new Crypter(cryptionKeys(this.parameters.databaseType));

        // Check if parameters is valid for updating.
        if (!(this.parameters.updatableFine.property instanceof Fine))
            throw httpsError(
                'invalid-argument',
                'Fine property isn\'t from type \'Fine\'.',
                this.logger
            );

        // Set updated item.
        await this.fineReference.set(crypter.encodeEncrypt(this.parameters.updatableFine.databaseObject),
            error => {
                if (error !== null)
                    throw httpsError(
                        'internal',
                        `Couldn't update fine, underlying error: ${error.name}, ${error.message}`,
                        this.logger
                    );
            }
        );
    }
}

export namespace ChangeFineFunction {

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
         * Id of the club to change the fine
         */
        clubId: guid,

        /**
         * Type of the change
         */
        changeType: ChangeType,

        /**
         * Fine to change
         */
        updatableFine: Updatable<Fine | Deleted<guid>>
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
        readonly identifier: string = 'changeFine';

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
         * Constructs statistic with previous and changed fine
         * @param { Fine.Statistic | null } previousFine Previous fine before change.
         * @param { Fine.Statistic | null } changedFine Changed fine after change.
         */
        public constructor(
            public readonly previousFine: Fine.Statistic | undefined,
            public readonly changedFine: Fine.Statistic | undefined
        ) { }

        /**
         * Statistic property object that will be stored in the database.
         */
        public get databaseObject(): StatisticProperty.DatabaseObject {
            return {
                previousFine: this.previousFine?.databaseObject ?? null,
                changedFine: this.changedFine?.databaseObject ?? null,
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
             * Changed fine after change.
             */
            changedFine: Fine.Statistic.DatabaseObject | null;
        }
    }
}
