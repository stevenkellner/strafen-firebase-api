import { guid } from './guid';
import { Deleted, httpsError, DataSnapshot } from '../utils';
import { ParameterContainer } from '../ParameterContainer';
import { PersonName } from './PersonName';
import { Logger } from '../Logger';

/**
 * Contains all properties of a person.
 */
export class Person {

    /**
     * Constructs person with an id and a name.
     * @param { guid } id Id of the person.
     * @param { PersonName } name Name of the person.
     */
    public constructor(
        public readonly id: guid,
        public readonly name: PersonName
    ) {}

    /**
     * Person object without id that will be stored in the database.
     */
    get databaseObjectWithoutId(): Person.DatabaseObjectWithoutId {
        return {
            name: this.name.databaseObject,
        };
    }

    /**
     * Person object that will be stored in the database.
     */
    get databaseObject(): Person.DatabaseObject {
        return {
            id: this.id.guidString,
            name: this.name.databaseObject,
        };
    }

    /**
     * Gets this person for statistics.
     */
    public get statistic(): Person.Statistic {
        return new Person.Statistic(this.id, this.name);
    }
}

export namespace Person {

    /**
     * Person object without id that will be stored in the database.
     */
    export interface DatabaseObjectWithoutId {

        /**
         * Name of the person
         */
        name: PersonName.DatabaseObject;
    }

    /**
     * Person object that will be stored in the database.
     */
    export type DatabaseObject = { id: string } & DatabaseObjectWithoutId;

    /**
     * Builds person from specified value.
     * @param { object } value Value to build person from.
     * @param { Logger } logger Logger to log this method.
     * @return { Person | Deleted<guid> } Builded person.
     */
    export function fromObject(value: object & any, logger: Logger): Person | Deleted<guid> {
        logger.append('Person.fromObject', { value });

        // Check if type of id is string
        if (typeof value.id !== 'string')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse Person parameter 'id'. Expected type 'string', but got '${value.id}' from type '${typeof value.id}'.`,
                logger
            );
        const id = guid.fromString(value.id, logger.nextIndent);

        // Check if person is deleted
        if (typeof value.deleted !== 'undefined') {
            if (typeof value.deleted !== 'boolean' || !value.deleted)
                throw httpsError(
                    'invalid-argument',
                    'Couldn\'t parse person, deleted argument wasn\'t from type boolean or was false.',
                    logger
                );
            return new Deleted(id);
        }

        // Check if type of name is object
        if (typeof value.name !== 'object')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse Person parameter 'name'. Expected type 'object', but got '${value.name}' from type '${typeof value.name}'.`,
                logger
            );
        const name = PersonName.fromObject(value.name, logger.nextIndent);

        // Return person
        return new Person(id, name);

    }

    /**
     * Builds person from specified value.
     * @param { any } value Value to build person from.
     * @param { Logger } logger Logger to log this method.
     * @return { Person | Deleted<guid> } Builded person.
     */
    export function fromValue(value: any, logger: Logger): Person | Deleted<guid> {
        logger.append('Person.fromValue', { value });

        // Check if value is from type object
        if (typeof value !== 'object')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse person, expected type 'object', but bot ${value} from type '${typeof value}'`,
                logger
            );

        // Return person.
        return Person.fromObject(value, logger.nextIndent);
    }

    /**
     * Builds person from specified snapshot.
     * @param { DataSnapshot } snapshot Snapshot to build person from.
     * @param { Logger } logger Logger to log this method.
     * @return { Person | Deleted<guid> } Builded person.
     */
    export function fromSnapshot(snapshot: DataSnapshot, logger: Logger): Person | Deleted<guid> {
        logger.append('Person.fromSnapshot', { snapshot });

        // Check if data exists in snapshot
        if (!snapshot.exists())
            throw httpsError('invalid-argument', 'Couldn\'t parse Person since no data exists in snapshot.', logger);

        // Get id
        const idString = snapshot.key;
        if (idString == null)
            throw httpsError('invalid-argument', 'Couldn\'t parse Person since snapshot has an invalid key.', logger);

        // Get data from snapshot
        const data = snapshot.val();
        if (typeof data !== 'object')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse Person from snapshot since data isn't an object: ${data}`,
                logger
            );

        // Return person.
        return Person.fromObject({
            id: idString,
            ...data,
        }, logger.nextIndent);
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * @deprecated Use `container.parameter(parameterName, 'object', logger.nextIndent,
     * Person.fromObject)` instead.
     */
    export function fromParameterContainer(
        container: ParameterContainer,
        parameterName: string,
        logger: Logger
    ): Person | Deleted<guid> {
        logger.append('Person.fromParameterContainer', { container, parameterName });

        // Build and return person.
        return Person.fromObject(
            container.parameter(parameterName, 'object', logger.nextIndent),
            logger.nextIndent
        );
    }

    /**
     * Statistic of a person.
     */
    export class Statistic {

        /**
         * Constructs statistic with id and name.
         * @param { guid } id Id of the statisitc person.
         * @param { PersonName } name Name of the statistic person.
         */
        public constructor(
            private readonly id: guid,
            private readonly name: PersonName,
        ) { }

        /**
         * Person statistic object that will be stored in the database.
         */
        get databaseObject(): Person.Statistic.DatabaseObject {
            return {
                id: this.id.guidString,
                name: this.name.databaseObject,
            };
        }
    }

    export namespace Statistic {

        /**
         * Person statistic object that will be stored in the database.
         */
        export interface DatabaseObject {

            /**
             * Id of the statistic person.
             */
            id: string;

            /**
             * Name of the statistic person.
             */
            name: PersonName.DatabaseObject;
        }
    }
}
