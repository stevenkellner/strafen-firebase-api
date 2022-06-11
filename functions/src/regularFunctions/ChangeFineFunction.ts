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
import { Fine } from '../TypeDefinitions/Fine';
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
            'ChangeFineFunction.constructor',
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
        this.logger.append('ChangeFineFunction.executeFunction', {}, 'info');

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
            `${this.parameters.clubId.guidString}/fines/${this.parameters.updatableFine.property.id.guidString}/updateProperties`,
            this.parameters.updatableFine.updateProperties,
            this.parameterContainer,
            this.logger.nextIndent,
        );

        // Get previous fine
        const fineSnapshot = await this.fineReference.once('value');
        let previousFine: Fine.Statistic | null = null;
        if (fineSnapshot.exists()) {
            const previousRawFine = Fine.fromSnapshot(fineSnapshot, this.logger.nextIndent);
            if (previousRawFine instanceof Fine)
                previousFine = await previousRawFine.statistic(
                    this.parameters.clubId,
                    this.parameterContainer,
                    this.logger.nextIndent,
                );
        }

        // Change fine
        let changedFine: Fine.Statistic | null = null;
        switch (this.parameters.changeType.value) {
        case 'delete':
            await this.deleteItem();
            break;

        case 'update':
            await this.updateItem();
            changedFine = await (this.parameters.updatableFine.property as Fine).statistic(
                this.parameters.clubId,
                this.parameterContainer,
                this.logger.nextIndent,
            );
            break;
        }
        // Save statistic
        await saveStatistic(
            new Statistic(new StatisticProperty(previousFine, changedFine)),
            this.parameters.clubId,
            this.parameterContainer,
            this.logger.nextIndent,
        );
    }

    /**
     * Reference to the fine to change.
     */
    private get fineReference(): admin.database.Reference {
        return reference(
            `${this.parameters.clubId.guidString}/fines/${this.parameters.updatableFine.property.id.guidString}`,
            this.parameterContainer,
            this.logger.nextIndent
        );
    }

    /**
     * Deletes person.
     */
    private async deleteItem(): Promise<void> {
        this.logger.append('ChangePersonFunction.deleteItem');

        // Check if parameters is valid for deleting.
        if (!(this.parameters.updatableFine.property instanceof Deleted))
            throw httpsError(
                'invalid-argument',
                'Fine property isn\'t from type \'Deleted\'.',
                this.logger
            );

        // Delete item.
        if (await existsData(this.fineReference)) {
            await this.fineReference.set(this.parameters.updatableFine.databaseObject, error => {
                if (error != null)
                    throw httpsError('internal',
                        `Couldn't delete fine, underlying error: ${error.name}, ${error.message}`,
                        this.logger
                    );
            });
        }
    }

    /**
     * Updates fine.
     */
    private async updateItem(): Promise<void> {
        this.logger.append('ChangeFineFunction.updateItem');

        // Check if parameters is valid for updating.
        if (!(this.parameters.updatableFine.property instanceof Fine))
            throw httpsError(
                'invalid-argument',
                'Fine property isn\'t from type \'Fine\'.',
                this.logger
            );

        // Set updated item.
        await this.fineReference.set(this.parameters.updatableFine.databaseObject, error => {
            if (error !== null)
                throw httpsError(
                    'internal',
                    `Couldn't update fine, underlying error: ${error.name}, ${error.message}`,
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
            updatableFine: Updatable.fromRawProperty(
                container.parameter('fine', 'object', this.logger.nextIndent),
                Fine.fromObject,
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
    readonly identifier: string = 'changeFine';

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
     * Constructs statistic with previous and changed fine
     * @param { Fine.Statistic | null } previousFine Previous fine before change.
     * @param { Fine.Statistic | null } changedFine Changed fine after change.
     */
    public constructor(
        public readonly previousFine: Fine.Statistic | null,
        public readonly changedFine: Fine.Statistic | null
    ) {}

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

namespace StatisticProperty {

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
