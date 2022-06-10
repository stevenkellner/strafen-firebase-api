import * as admin from 'firebase-admin';
import {
    checkPrerequirements,
    IFirebaseFunction,
    httpsError,
    checkUpdateProperties,
    reference,
} from '../utils';
import { ParameterContainer } from '../ParameterContainer';
import { guid } from '../TypeDefinitions/guid';
import { DatabaseType } from '../TypeDefinitions/DatabaseType';
import { Logger } from '../Logger';
import { Updatable } from '../TypeDefinitions/UpdateProperties';
import { AuthData } from 'firebase-functions/lib/common/providers/https';
import {
    IStatisticProperty,
    saveStatistic,
    IStatistic,
} from '../Statistic';
import { Fine } from '../TypeDefinitions/Fine';
import { PayedState } from '../TypeDefinitions/PayedState';

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
            'ChangeFinePayedFunction.constructor',
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
    async executeFunction() {
        this.logger.append('ChangeFinePayedFunction.executeFunction', {}, 'info');

        // Check prerequirements
        await checkPrerequirements(
            this.parameterContainer,
            this.logger.nextIndent,
            this.auth,
            this.parameters.clubId
        );

        // Check update timestamp
        await checkUpdateProperties(
            `${this.parameters.clubId.guidString}/fines/${this.parameters.fineId.guidString}/payedState
            /updateProperties`,
            this.parameters.updatablePayedState.updateProperties,
            this.parameterContainer,
            this.logger.nextIndent,
        );

        // Get statistics fine
        const statisticsFine = await this.getStatisticsFine();

        // Set payed state
        await this.payedStateReference.set(this.parameters.updatablePayedState.databaseObject, error => {
            if (error != null)
                throw httpsError(
                    'internal',
                    `Couldn't update payed state, underlying error: ${error.name}, ${error.message}`,
                    this.logger
                );
        });

        // Save statistic
        await saveStatistic(
            new Statistic(new StatisticProperty(statisticsFine, this.parameters.updatablePayedState.property)),
            this.parameterContainer,
            this.logger.nextIndent,
        );
    }

    /**
     * Reference to the fine of payed state.
     */
    private get fineReference(): admin.database.Reference {
        return reference(
            `${this.parameters.clubId.guidString}/fines/${this.parameters.fineId.guidString}`,
            this.parameterContainer,
            this.logger.nextIndent
        );
    }

    /**
     * Reference to the payed state to change.
     */
    private get payedStateReference(): admin.database.Reference {
        return reference(
            `${this.parameters.clubId.guidString}/fines/${this.parameters.fineId.guidString}/payedState`,
            this.parameterContainer,
            this.logger.nextIndent
        );
    }

    /**
     * Gets previous fine for statistics.
     * @return { Promise<StatisticsFine> } Fine for statistics.
     */
    private async getStatisticsFine(): Promise<Fine.Statistic> {
        this.logger.append('ChangeFinePayedFunction.statisticsFine');

        const payedSnapshot = await this.fineReference.once('value');
        const fine = Fine.fromSnapshot(payedSnapshot, this.logger.nextIndent);
        if (!(fine instanceof Fine))
            throw httpsError('internal', 'Couldn\'t get statistic fine from \'Deleted\'.', this.logger);
        return await fine.statistic(this.parameters.clubId, this.parameterContainer, this.logger.nextIndent);
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
    updatablePayedState: Updatable<PayedState>
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
            fineId: container.parameter('fineId', 'string', this.logger.nextIndent, guid.fromString),
            updatablePayedState: Updatable.fromRawProperty(
                container.parameter('updatablePayedState', 'object', this.logger.nextIndent),
                PayedState.fromObject,
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
    readonly identifier: string = 'changeFinePayed';

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
     * Constructs statistic with previous fine and changed payed state
     * @param { Fine.Statistic } previousFine Previous fine before change.
     * @param { PayedState } changedState Changed payed state after change.
     */
    public constructor(
        public readonly previousFine: Fine.Statistic,
        public readonly changedState: PayedState
    ) {}

    /**
     * Statistic property object that will be stored in the database.
     */
    public get databaseObject(): StatisticProperty.DatabaseObject {
        return {
            previousPerson: this.previousFine?.databaseObject ?? null,
            changedPerson: this.changedState?.databaseObject ?? null,
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
        previousPerson: Fine.Statistic.DatabaseObject | null;

        /**
         * Changed payed state after change.
         */
        changedPerson: PayedState.DatabaseObject | null;
    }
}
