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
            'ChangeReasonTemplateFunction.constructor',
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
        this.logger.append('ChangeReasonTemplateFunction.executeFunction', {}, 'info');

        // Check prerequirements
        await checkPrerequirements(
            this.parameterContainer,
            this.logger.nextIndent,
            this.auth,
            this.parameters.clubId
        );

        // Check update timestamp
        await checkUpdateProperties(
            // eslint-disable-next-line max-len
            `${this.parameters.clubId.guidString}/templateReasons/${this.parameters.updatableReasonTemplate.property.id.guidString}/updateProperties`,
            this.parameters.updatableReasonTemplate.updateProperties,
            this.parameterContainer,
            this.logger.nextIndent,
        );

        // Get previous reason template
        const reasonTemplateSnapshot = await this.reasonTemplateReference.once('value');
        let previousReasonTemplate: ReasonTemplate.Statistic | null = null;
        if (reasonTemplateSnapshot.exists()) {
            const previousRawReasonTemplate = ReasonTemplate.fromSnapshot(
                reasonTemplateSnapshot,
                this.logger.nextIndent
            );
            if (previousRawReasonTemplate instanceof ReasonTemplate)
                previousReasonTemplate = previousRawReasonTemplate.statistic;
        }

        // Change reason template
        let changedReasonTemplate: ReasonTemplate.Statistic | null = null;
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
            new Statistic(new StatisticProperty(previousReasonTemplate, changedReasonTemplate)),
            this.parameters.clubId,
            this.parameterContainer,
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
            this.parameterContainer,
            this.logger.nextIndent
        );
    }

    /**
     * Deletes reason.
     */
    private async deleteItem(): Promise<void> {
        this.logger.append('ChangeReasonTemplateFunction.deleteItem');

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
            await this.reasonTemplateReference.set(this.parameters.updatableReasonTemplate.databaseObject, error => {
                if (error != null)
                    throw httpsError('internal',
                        `Couldn't delete reason template, underlying error: ${error.name}, ${error.message}`,
                        this.logger
                    );
            });
        }
    }

    /**
     * Updates reason.
     */
    private async updateItem(): Promise<void> {
        this.logger.append('ChangeReasonTemplateFunction.updateItem');

        // Check if parameters is valid for updating.
        if (!(this.parameters.updatableReasonTemplate.property instanceof ReasonTemplate))
            throw httpsError(
                'invalid-argument',
                'ReasonTemplate property isn\'t from type \'ReasonTemplate\'.',
                this.logger
            );

        // Set updated item.
        await this.reasonTemplateReference.set(this.parameters.updatableReasonTemplate.databaseObject, error => {
            if (error !== null)
                throw httpsError(
                    'internal',
                    `Couldn't update reason template, underlying error: ${error.name}, ${error.message}`,
                    this.logger
                );
        });
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
            changeType: container.parameter('changeType', 'string', this.logger.nextIndent, ChangeType.fromString),
            updatableReasonTemplate: Updatable.fromRawProperty(
                container.parameter('updatableReasonTemplate', 'object', this.logger.nextIndent),
                ReasonTemplate.fromObject,
                this.logger.nextIndent,
            ),
        };
    }
}

/**
 * Statistic of this firebase function that will be stored in the database.
 */
class Statistic implements IStatistic<StatisticProperty> {

    /**
     * Identifier of the statistic of a database update.
     */
    readonly identifier: string = 'changeReasonTemplate';

    /**
     * Constructs Statistic with statistic property.
     * @param { StatisticProperty } property Property of the statistic of a database update.
     */
    constructor(readonly property: StatisticProperty) {}
}

/**
 * Statistic property of this firebase function that will be stored in the database.
 */
class StatisticProperty implements IStatisticProperty<StatisticProperty.DatabaseObject> {

    /**
     * Constructs statistic with previous and changed reason
     * @param { ReasonTemplate.Statistic | null } previousReasonTemplate Previous reason before change.
     * @param { ReasonTemplate.Statistic | null } changedReasonTemplate Changed reason after change.
     */
    public constructor(
        public readonly previousReasonTemplate: ReasonTemplate.Statistic | null,
        public readonly changedReasonTemplate: ReasonTemplate.Statistic | null
    ) {}

    /**
     * Statistic property object that will be stored in the database.
     */
    public get databaseObject(): StatisticProperty.DatabaseObject {
        return {
            previousReasonTemplate: this.previousReasonTemplate?.databaseObject ?? null,
            changedReasonTemplate: this.changedReasonTemplate?.databaseObject ?? null,
        };
    }
}

namespace StatisticProperty {

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
