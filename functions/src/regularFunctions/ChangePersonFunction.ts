import * as admin from 'firebase-admin';
import {
    checkPrerequirements,
    IFirebaseFunction,
    existsData,
    httpsError,
    checkUpdateProperties,
    Deleted,
    reference,
    getCountUpdate,
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
import { ParameterParser } from '../ParameterParser';
import { Crypter } from '../crypter/Crypter';
import { cryptionKeys } from '../privateKeys';

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
    ChangePersonFunction.Parameters,
    ChangePersonFunction.ReturnType
> {

    /**
     * Firebase function parameters passed to the firebase function.
     */
    public parameters: ChangePersonFunction.Parameters;

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
            'ChangePersonFunction.constructor',
            { data, auth },
            'notice'
        );
        const parameterContainer = new ParameterContainer(data, this.logger.nextIndent);
        const parameterParser = new ParameterParser<ChangePersonFunction.Parameters>(
            {
                privateKey: 'string',
                databaseType: ['string', DatabaseType.fromString],
                clubId: ['string', guid.fromString],
                changeType: ['string', ChangeType.fromString],
                updatablePerson: ['object', (value: object, logger: Logger) =>
                    Updatable.fromRawProperty(value, Person.fromObject, logger),
                ],
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    /**
     * Execute this firebase function.
     * @return { Promise<ReturnType> } Return value of this firebase function.
     */
    public async executeFunction(): Promise<ChangePersonFunction.ReturnType> {
        this.logger.append('ChangePersonFunction.executeFunction', {}, 'info');

        // Check prerequirements
        await checkPrerequirements(
            this.parameters,
            this.logger.nextIndent,
            this.auth,
            this.parameters.clubId,
        );

        // Get crypter
        const crypter = new Crypter(cryptionKeys(this.parameters.databaseType));

        // Get previous person
        const personSnapshot = await this.personReference.once('value');
        let previousPerson: Updatable<Person | Deleted<guid>> | undefined;
        if (personSnapshot.exists()) {
            previousPerson = Updatable.fromRawProperty(
                {
                    id: personSnapshot.key,
                    ...crypter.decryptDecode(personSnapshot.val()),
                },
                Person.fromObject,
                this.logger.nextIndent
            );
        }

        // Check update timestamp
        checkUpdateProperties(
            previousPerson?.updateProperties,
            this.parameters.updatablePerson.updateProperties,
            this.parameters.databaseType,
            this.logger.nextIndent,
        );

        // Change person
        let changedPerson: Person.Statistic | undefined;
        switch (this.parameters.changeType.value) {
        case 'delete':
            await this.deleteItem();
            break;

        case 'update':
            await this.updateItem();
            changedPerson = (this.parameters.updatablePerson.property as Person).statistic;
            break;
        }

        // Change count
        const countUpdate = getCountUpdate(previousPerson, this.parameters.changeType);
        const personsCountSnapshot = await this.countReference.once('value');
        if (!personsCountSnapshot.exists) throw httpsError('internal', 'Couldn\'t get list count.', this.logger);
        const personsCount: { total: number, undeleted: number } = personsCountSnapshot.val();
        await this.countReference.set({
            total: personsCount.total + countUpdate.total,
            undeleted: personsCount.undeleted + countUpdate.undeleted,
        });

        // Save statistic
        await saveStatistic(
            new ChangePersonFunction.Statistic(
                new ChangePersonFunction.StatisticProperty(previousPerson?.property, changedPerson)
            ),
            this.parameters,
            this.logger.nextIndent,
        );
    }

    /**
     * Reference to the person to change.
     */
    private get personReference(): admin.database.Reference {
        return reference(
            `${this.parameters.clubId.guidString}/persons/${this.parameters.updatablePerson.property.id.guidString}`,
            this.parameters.databaseType,
            this.logger.nextIndent
        );
    }

    /**
     * Reference to persons fount.
     */
    private get countReference(): admin.database.Reference {
        return reference(
            `${this.parameters.clubId.guidString}/listCounts/persons`,
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
        if (!(this.parameters.updatablePerson.property instanceof Deleted))
            throw httpsError(
                'invalid-argument',
                'Person property isn\'t from type \'Deleted\'.',
                this.logger
            );

        // Check if person to delete is already signed in.
        const personSnapshot = await this.personReference.once('value');
        if (personSnapshot.exists()) {
            const previousPerson = crypter.decryptDecode(personSnapshot.val());
            if (previousPerson.signInData !== undefined)
                throw httpsError(
                    'unavailable',
                    'Person is already signed in!',
                    this.logger
                );
        }

        // TODO: delete all associated fines

        // Delete item.
        if (await existsData(this.personReference)) {
            await this.personReference.set(crypter.encodeEncrypt(this.parameters.updatablePerson.databaseObject),
                error => {
                    if (error != null)
                        throw httpsError('internal',
                            `Couldn't delete person, underlying error: ${error.name}, ${error.message}`,
                            this.logger
                        );
                }
            );
        }
    }

    /**
     * Updates person.
     */
    private async updateItem(): Promise<void> {
        this.logger.append('ChangePersonFunction.updateItem');
        const crypter = new Crypter(cryptionKeys(this.parameters.databaseType));

        // Check if parameters is valid for updating.
        if (!(this.parameters.updatablePerson.property instanceof Person))
            throw httpsError(
                'invalid-argument',
                'Person property isn\'t from type \'Person\'.',
                this.logger
            );

        // Set updated item.
        await this.personReference.set(crypter.encodeEncrypt(this.parameters.updatablePerson.databaseObject),
            error => {
                if (error !== null)
                    throw httpsError(
                        'internal',
                        `Couldn't update person, underlying error: ${error.name}, ${error.message}`,
                        this.logger
                    );
            }
        );
    }
}

export namespace ChangePersonFunction {

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
    export type ReturnType = void;

    /**
     * Statistic of this firebase function that will be stored in the database.
     */
    export class Statistic implements IStatistic<StatisticProperty> {

        /**
         * Identifier of the statistic of a database update.
         */
        readonly identifier: string = 'changePerson';

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
         * Constructs statistic with previous and changed person
         * @param { Person.Statistic | null } previousPerson Previous person before change.
         * @param { Person.Statistic | null } changedPerson Changed person after change.
         */
        public constructor(
            public readonly previousPerson: Person | Deleted<guid> | undefined,
            public readonly changedPerson: Person.Statistic | undefined
        ) { }

        /**
         * Statistic property object that will be stored in the database.
         */
        public get databaseObject(): StatisticProperty.DatabaseObject {
            const previousPerson = this.previousPerson instanceof Person ?
                this.previousPerson.statistic.databaseObject ?? null : null;
            return {
                previousPerson: previousPerson,
                changedPerson: this.changedPerson?.databaseObject ?? null,
            };
        }
    }

    export namespace StatisticProperty {

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
}
