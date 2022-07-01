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
import { ReasonTemplate } from '../TypeDefinitions/ReasonTemplate';
import { Logger } from '../Logger';
import { Updatable } from '../TypeDefinitions/Updatable';
import { AuthData } from 'firebase-functions/lib/common/providers/https';
import {
    IStatisticProperty,
    saveStatistic,
    IStatistic,
} from '../Statistic';
import { ParameterParser } from '../ParameterParser';
import { cryptionKeys } from '../privateKeys';
import { Crypter } from '../crypter/Crypter';

/**
 * @summary
 * Changes a element of reason template list.
 *
 * Saved statistik:
 *  - name: changeReasonTemplate
 *  - properties:
 *      - previousReasonTemplate ({@link ReasonTemplate} | null): Previous reason template to change
 *      - changedReasonTemplate ({@link ReasonTemplate} | null): Changed reason template or null if
 *          change type is `delete`
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - databaseType ({@link DatabaseType}): database type of the change
 *  - clubId ({@link guid}): id of the club to change reason
 *  - changeType ({@link ChangeType}}): type of the change
 *  - reasonTemplate ({@link Updatable}<{@link ReasonTemplate} | {@link Deleted}>): reason template to change
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - internal: if couldn't change reason template in database
 */
export class ChangeReasonTemplateFunction implements IFirebaseFunction<
    ChangeReasonTemplateFunction.Parameters,
    ChangeReasonTemplateFunction.ReturnType
> {

    /**
     * Firebase function parameters passed to the firebase function.
     */
    public parameters: ChangeReasonTemplateFunction.Parameters;

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
            'ChangeReasonTemplateFunction.constructor',
            { data, auth },
            'notice'
        );
        const parameterContainer = new ParameterContainer(data, this.logger.nextIndent);
        const parameterParser = new ParameterParser<ChangeReasonTemplateFunction.Parameters>(
            {
                privateKey: 'string',
                databaseType: ['string', DatabaseType.fromString],
                clubId: ['string', guid.fromString],
                changeType: ['string', ChangeType.fromString],
                updatableReasonTemplate: ['object', (value: object, logger: Logger) =>
                    Updatable.fromRawProperty(value, ReasonTemplate.fromObject, logger),
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
        this.logger.append('ChangeReasonTemplateFunction.executeFunction', {}, 'info');

        // Check prerequirements
        await checkPrerequirements(
            this.parameters,
            this.logger.nextIndent,
            this.auth,
            this.parameters.clubId
        );

        // Get crypter
        const crypter = new Crypter(cryptionKeys(this.parameters.databaseType));

        // Get previous reason template
        const reasonTemplateSnapshot = await this.reasonTemplateReference.once('value');
        let previousReasonTemplate: Updatable<ReasonTemplate | Deleted<guid>> | undefined;
        if (reasonTemplateSnapshot.exists()) {
            previousReasonTemplate = Updatable.fromRawProperty(
                {
                    id: reasonTemplateSnapshot.key,
                    ...crypter.decryptDecode(reasonTemplateSnapshot.val()),
                },
                ReasonTemplate.fromObject,
                this.logger.nextIndent,
            );
        }

        // Check update timestamp
        checkUpdateProperties(
            previousReasonTemplate?.updateProperties,
            this.parameters.updatableReasonTemplate.updateProperties,
            this.parameters.databaseType,
            this.logger.nextIndent,
        );

        // Change reason template
        let changedReasonTemplate: ReasonTemplate.Statistic | undefined;
        switch (this.parameters.changeType.value) {
        case 'delete':
            await this.deleteItem();
            break;

        case 'update':
            await this.updateItem();
            changedReasonTemplate = (this.parameters.updatableReasonTemplate.property as ReasonTemplate).statistic;
            break;
        }

        // Save statistic
        await saveStatistic(
            new ChangeReasonTemplateFunction.Statistic(
                new ChangeReasonTemplateFunction.StatisticProperty(
                    previousReasonTemplate?.property,
                    changedReasonTemplate
                )
            ),
            this.parameters,
            this.logger.nextIndent,
        );
    }

    /**
     * Reference to the reason to change.
     */
    private get reasonTemplateReference(): admin.database.Reference {
        return reference(
            // eslint-disable-next-line max-len
            `${this.parameters.clubId.guidString}/reasonTemplates/${this.parameters.updatableReasonTemplate.property.id.guidString}`,
            this.parameters.databaseType,
            this.logger.nextIndent
        );
    }

    /**
     * Deletes reason.
     */
    private async deleteItem(): Promise<void> {
        this.logger.append('ChangeReasonTemplateFunction.deleteItem');
        const crypter = new Crypter(cryptionKeys(this.parameters.databaseType));

        // Check if parameters is valid for deleting.
        if (!(this.parameters.updatableReasonTemplate.property instanceof Deleted))
            throw httpsError(
                'invalid-argument',
                'ReasonTemplate property isn\'t from type \'Deleted\'.',
                this.logger
            );

        // TODO check if reason template is needed in a fine.

        // Delete item.
        if (await existsData(this.reasonTemplateReference)) {
            await this.reasonTemplateReference.set(
                crypter.encodeEncrypt(this.parameters.updatableReasonTemplate.databaseObject),
                error => {
                    if (error != null)
                        throw httpsError('internal',
                            `Couldn't delete reason template, underlying error: ${error.name}, ${error.message}`,
                            this.logger
                        );
                }
            );
        }
    }

    /**
     * Updates reason.
     */
    private async updateItem(): Promise<void> {
        this.logger.append('ChangeReasonTemplateFunction.updateItem');
        const crypter = new Crypter(cryptionKeys(this.parameters.databaseType));

        // Check if parameters is valid for updating.
        if (!(this.parameters.updatableReasonTemplate.property instanceof ReasonTemplate))
            throw httpsError(
                'invalid-argument',
                'ReasonTemplate property isn\'t from type \'ReasonTemplate\'.',
                this.logger
            );

        // Set updated item.
        await this.reasonTemplateReference.set(
            crypter.encodeEncrypt(this.parameters.updatableReasonTemplate.databaseObject),
            error => {
                if (error !== null)
                    throw httpsError(
                        'internal',
                        `Couldn't update reason template, underlying error: ${error.name}, ${error.message}`,
                        this.logger
                    );
            }
        );
    }
}

export namespace ChangeReasonTemplateFunction {

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
         * Id of the club to change the reason
         */
        clubId: guid,

        /**
         * Type of the change
         */
        changeType: ChangeType,

        /**
         * Reason to change
         */
        updatableReasonTemplate: Updatable<ReasonTemplate | Deleted<guid>>
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
        readonly identifier: string = 'changeReasonTemplate';

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
         * Constructs statistic with previous and changed reason
         * @param { ReasonTemplate.Statistic | null } previousReasonTemplate Previous reason before change.
         * @param { ReasonTemplate.Statistic | null } changedReasonTemplate Changed reason after change.
         */
        public constructor(
            public readonly previousReasonTemplate: ReasonTemplate | Deleted<guid> | undefined,
            public readonly changedReasonTemplate: ReasonTemplate.Statistic | undefined
        ) { }

        /**
         * Statistic property object that will be stored in the database.
         */
        public get databaseObject(): StatisticProperty.DatabaseObject {
            const previousReasonTemplate = this.previousReasonTemplate instanceof ReasonTemplate ?
                this.previousReasonTemplate.statistic.databaseObject ?? null : null;
            return {
                previousReasonTemplate: previousReasonTemplate,
                changedReasonTemplate: this.changedReasonTemplate?.databaseObject ?? null,
            };
        }
    }

    export namespace StatisticProperty {

        /**
         * Statistic property object that will be stored in the database.
         */
        export interface DatabaseObject {

            /**
             * Previous reason before change.
             */
            previousReasonTemplate: ReasonTemplate.Statistic.DatabaseObject | null;

            /**
             * Changed reason after change.
             */
            changedReasonTemplate: ReasonTemplate.Statistic.DatabaseObject | null;
        }
    }
}
