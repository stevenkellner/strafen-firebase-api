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
import { Person } from '../TypeDefinitions/Person';
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
 * Changes a element of person list.
 *
 * Saved statistik:
 *  - name: changePerson
 *  - properties:
 *      - previousPerson ({@link Person} | null): Previous person before change
 *      - changedPerson ({@link Person} | null): Changed person or null if change type is `delete`
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - databaseType ({@link DatabaseType}): database type of the change
 *  - clubId ({@link guid}): id of the club to change the person
 *  - changeType ({@link ChangeType}}): type of the change
 *  - person ({@link Updatable}<{@link Person} | {@link Deleted}<{@link guid}>>): person to change
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - unavailable: if person is already signed in
 *    - internal: if couldn't change person in database
 */
export class ChangePersonFunction implements IFirebaseFunction<
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
            'ChangePersonFunction.constructor',
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
     * Execute this firebase function.
     * @return { Promise<ReturnType> } Return value of this firebase function.
     */
    public async executeFunction(): Promise<ReturnType> {
        this.logger.append('ChangePersonFunction.executeFunction', {}, 'info');

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
            `${this.parameters.clubId.guidString}/persons/${this.parameters.updatablePerson.property.id.guidString}/updateProperties`,
            this.parameters.updatablePerson.updateProperties,
            this.parameterContainer,
            this.logger.nextIndent,
        );

        // Get previous person
        const personSnapshot = await this.personReference.once('value');
        let previousPerson: Person.Statistic | null = null;
        if (personSnapshot.exists()) {
            const previousRawPerson = Person.fromSnapshot(personSnapshot, this.logger.nextIndent);
            if (previousRawPerson instanceof Person)
                previousPerson = previousRawPerson.statistic;
        }

        // Change person
        let changedPerson: Person.Statistic | null = null;
        switch (this.parameters.changeType.value) {
        case 'delete':
            await this.deleteItem();
            break;

        case 'update':
            await this.updateItem();
            changedPerson = (this.parameters.updatablePerson.property as Person).statistic;
            break;
        }

        // Save statistic
        await saveStatistic(
            new Statistic(new StatisticProperty(previousPerson, changedPerson)),
            this.parameters.clubId,
            this.parameterContainer,
            this.logger.nextIndent,
        );
    }

    /**
     * Reference to the person to change.
     */
    private get personReference(): admin.database.Reference {
        return reference(
            `${this.parameters.clubId.guidString}/persons/${this.parameters.updatablePerson.property.id.guidString}`,
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
        if (!(this.parameters.updatablePerson.property instanceof Deleted))
            throw httpsError(
                'invalid-argument',
                'Person property isn\'t from type \'Deleted\'.',
                this.logger
            );

        // Check if person to delete is already signed in.
        if (await existsData(this.personReference.child('signInData')))
            throw httpsError(
                'unavailable',
                'Person is already signed in!',
                this.logger
            );

        // TODO: delete all associated fines

        // Delete item.
        if (await existsData(this.personReference)) {
            await this.personReference.set(this.parameters.updatablePerson.databaseObject, error => {
                if (error != null)
                    throw httpsError('internal',
                        `Couldn't delete person, underlying error: ${error.name}, ${error.message}`,
                        this.logger
                    );
            });
        }
    }

    /**
     * Updates person.
     */
    private async updateItem(): Promise<void> {
        this.logger.append('ChangePersonFunction.updateItem');

        // Check if parameters is valid for updating.
        if (!(this.parameters.updatablePerson.property instanceof Person))
            throw httpsError(
                'invalid-argument',
                'Person property isn\'t from type \'Person\'.',
                this.logger
            );

        // Set updated item.
        await this.personReference.set(this.parameters.updatablePerson.databaseObject, error => {
            if (error !== null)
                throw httpsError(
                    'internal',
                    `Couldn't update person, underlying error: ${error.name}, ${error.message}`,
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
     * Id of the club to change the person
     */
    clubId: guid,

    /**
     * Type of the change
     */
    changeType: ChangeType,

    /**
     * Person to change
     */
    updatablePerson: Updatable<Person | Deleted<guid>>
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
            updatablePerson: Updatable.fromRawProperty(
                container.parameter('updatablePerson', 'object', this.logger.nextIndent),
                Person.fromObject,
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
    readonly identifier: string = 'changePerson';

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
     * Constructs statistic with previous and changed person
     * @param { Person.Statistic | null } previousPerson Previous person before change.
     * @param { Person.Statistic | null } changedPerson Changed person after change.
     */
    public constructor(
        public readonly previousPerson: Person.Statistic | null,
        public readonly changedPerson: Person.Statistic | null
    ) {}

    /**
     * Statistic property object that will be stored in the database.
     */
    public get databaseObject(): StatisticProperty.DatabaseObject {
        return {
            previousPerson: this.previousPerson?.databaseObject ?? null,
            changedPerson: this.changedPerson?.databaseObject ?? null,
        };
    }
}

namespace StatisticProperty {

    /**
     * Statistic property object that will be stored in the database.
     */
    export interface DatabaseObject {

        /**
         * Previous person before change.
         */
        previousPerson: Person.Statistic.DatabaseObject | null;

        /**
         * Changed person after change.
         */
        changedPerson: Person.Statistic.DatabaseObject | null;
    }
}
