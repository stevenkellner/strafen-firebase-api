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
import { Updatable } from '../TypeDefinitions/UpdateProperties';
import { AuthData } from 'firebase-functions/lib/common/providers/https';
import {
    IStatisticProperty,
    saveStatistic,
    IStatistic,
} from '../Statistic';
import { LatePaymentInterest } from '../TypeDefinitions/LatePaymentInterest';

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
            'ChangeLatePaymentInterestFunction.constructor',
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
        this.logger.append('ChangeLatePaymentInterestFunction.executeFunction', {}, 'info');

        // Check prerequirements
        await checkPrerequirements(
            this.parameterContainer,
            this.logger.nextIndent,
            this.auth,
            this.parameters.clubId
        );

        // Check update timestamp
        await checkUpdateProperties(
            `${this.parameters.clubId.guidString}/latePaymentInterest/updateProperties`,
            this.parameters.updatableInterest.updateProperties,
            this.parameterContainer,
            this.logger.nextIndent,
        );

        // Get previous interest
        const interestSnapshot = await this.interestReference.once('value');
        let previousInterest: LatePaymentInterest | null = null;
        if (interestSnapshot.exists()) {
            const previousRawInterest = LatePaymentInterest.fromSnapshot(interestSnapshot, this.logger.nextIndent);
            if (previousRawInterest instanceof LatePaymentInterest)
                previousInterest = previousRawInterest;
        }

        // Change interest
        let changedInterest: LatePaymentInterest | null = null;
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
            new Statistic(new StatisticProperty(previousInterest, changedInterest)),
            this.parameters.clubId,
            this.parameterContainer,
            this.logger.nextIndent,
        );
    }

    /**
     * Reference to the person to change.
     */
    private get interestReference(): admin.database.Reference {
        return reference(
            `${this.parameters.clubId.guidString}/latePaymentInterest`,
            this.parameterContainer,
            this.logger.nextIndent
        );
    }

    /**
     * Deletes late payment interest.
     */
    private async deleteItem(): Promise<void> {
        this.logger.append('ChangePersonFunction.deleteItem');

        // Check if parameters is valid for deleting.
        if (!(this.parameters.updatableInterest.property instanceof Deleted))
            throw httpsError(
                'invalid-argument',
                'LatePaymentInterest property isn\'t from type \'Deleted\'.',
                this.logger
            );

        // Delete item.
        if (await existsData(this.interestReference)) {
            await this.interestReference.set(this.parameters.updatableInterest.databaseObject, error => {
                if (error != null)
                    throw httpsError('internal',
                        `Couldn't delete late payment interest, underlying error: ${error.name}, ${error.message}`,
                        this.logger
                    );
            });
        }
    }

    /**
     * Updates late payment interest.
     */
    private async updateItem(): Promise<void> {
        this.logger.append('ChangeLatePaymentInterestFunction.updateItem');

        // Check if parameters is valid for updating.
        if (!(this.parameters.updatableInterest.property instanceof LatePaymentInterest))
            throw httpsError(
                'invalid-argument',
                'LatePaymentInterest property isn\'t from type \'LatePaymentInterest\'.',
                this.logger
            );

        // Set updated item.
        await this.interestReference.set(this.parameters.updatableInterest.databaseObject, error => {
            if (error !== null)
                throw httpsError(
                    'internal',
                    `Couldn't update late payment interest, underlying error: ${error.name}, ${error.message}`,
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
            updatableInterest: Updatable.fromRawProperty(
                container.parameter('updatableInterest', 'object', this.logger.nextIndent),
                LatePaymentInterest.fromObject,
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
class StatisticProperty implements IStatisticProperty<StatisticProperty.DatabaseObject> {

    /**
     * Constructs statistic with previous and changed late payment interest
     * @param { LatePaymentInterest | null } previousInterest Previous late payment interest before change.
     * @param { LatePaymentInterest | null } changedInterest Changed late payment interest after change.
     */
    public constructor(
        public readonly previousInterest: LatePaymentInterest | null,
        public readonly changedInterest: LatePaymentInterest | null
    ) {}

    /**
     * Statistic property object that will be stored in the database.
     */
    public get databaseObject(): StatisticProperty.DatabaseObject {
        return {
            previousInterest: this.previousInterest?.databaseObject ?? null,
            changedInterest: this.changedInterest?.databaseObject ?? null,
        };
    }
}

namespace StatisticProperty {

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
