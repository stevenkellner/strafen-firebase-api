import { httpsError } from '../utils';
import { Logger } from '../Logger';

/**
 * Contains first and optional last name of person.
 */
export class PersonName {

    /**
     * Constructs person name with first and optional last name of person.
     * @param { string } first First name of a person.
     * @param { string | undefined } last Last name of a person.
     */
    public constructor(
        public readonly first: string,
        public readonly last?: string
    ) {}

    /**
     * Person name object that will be stored in the database.
     */
    get databaseObject(): PersonName.DatabaseObject {
        return {
            first: this.first,
            last: this.last ?? null,
        };
    }
}

export namespace PersonName {

    /**
     * Person name object that will be stored in the database.
     */
    export interface DatabaseObject {

        /**
         * First name of a person.
         */
        first: string;

        /**
         * Last name of a person.
         */
        last: string | null;
    }


    /**
     * Builds person name from specified value.
     * @param { object } value Value to build person name from.
     * @param { Logger } logger Logger to log this method.
     * @return { PersonName } Builded person name.
     */
    export function fromObject(value: object & any, logger: Logger): PersonName {
        logger.append('PersonName.fromObject', { value });


        // Check if type of first is string
        if (typeof value.first !== 'string')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse PersonName parameter 'first'. Expected type 'string', but got '${value.first}' from type '${typeof value.first}'.`,
                logger
            );

        // Check if type of last is string or undefined
        if (value.last === undefined || value.last === null)
            return new PersonName(value.first);

        if (typeof value.last === 'string')
            return new PersonName(value.first, value.last);

        throw httpsError(
            'invalid-argument',
            // eslint-disable-next-line max-len
            `Couldn't parse PersonName parameter 'last'. Expected type 'string' or undefined, but got '${value.last}' from type '${typeof value.last}'.`,
            logger
        );
    }

    /**
     * Builds person name from specified value.
     * @param { any } value Value to build person name from.
     * @param { Logger } logger Logger to log this method.
     * @return { PersonName } Builded person name.
     */
    export function fromValue(value: any, logger: Logger): PersonName {
        logger.append('PersonName.fromValue', { value });

        // Check if value is from type object
        if (typeof value !== 'object')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse PersonName, expected type 'object', but bot ${value} from type '${typeof value}'`,
                logger
            );

        // Return person name.
        return PersonName.fromObject(value, logger.nextIndent);
    }
}
