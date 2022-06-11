import { httpsError } from '../utils';
import { guid } from './guid';
import { Logger } from '../Logger';
import { PersonName } from './PersonName';

/**
 * Person properties with id, name, sign in date and if person is admin.
 */
export class PersonPropertiesWithIsAdmin {

    /**
     * Constructs person properties with id, name, sign in date and if person is admin.
     * @param { guid } id Id of the person.
     * @param { Date } signInDate Sign in date of the person.
     * @param { boolean } isAdmin Indicates whether person is admin.
     * @param { PersonName } name Name of the person
     */
    public constructor(
        public readonly id: guid,
        public readonly signInDate: Date,
        public readonly isAdmin: boolean,
        public readonly name: PersonName
    ) {}

    /**
     * Person properties object that will be stored in the database.
     */
    public get databaseObject(): PersonPropertiesWithIsAdmin.DatabaseObject {
        return {
            id: this.id.guidString,
            signInDate: this.signInDate.toISOString(),
            isAdmin: this.isAdmin,
            name: this.name.databaseObject,
        };
    }
}

export namespace PersonPropertiesWithIsAdmin {

    /**
     * Person properties object that will be stored in the database.
     */
    export interface DatabaseObject {

        /**
         * Id of the person.
         */
        id: string,

        /**
         * Sign in date of the person.
         */
        signInDate: string,

        /**
         * Indicates whether person is admin.
         */
        isAdmin: boolean,

        /**
         * Name of the person.
         */
        name: PersonName.DatabaseObject
    }

    /**
     * Builds person properties from specified value.
     * @param { object } value Value to build person properties from.
     * @param { Logger } logger Logger to log this method.
     * @return { PersonPropertiesWithIsAdmin } Builded person properties.
     */
    export function fromObject(value: object & any, logger: Logger): PersonPropertiesWithIsAdmin {
        logger.append('PersonProperties.fromObject', { value });

        // Check if type of id is string
        if (typeof value.id !== 'string')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse person properties parameter 'id'. Expected type 'string', but got '${value.id}' from type '${typeof value.id}'.`,
                logger
            );
        const id = guid.fromString(value.id, logger.nextIndent);

        // Check if type of sign in date is string
        if (typeof value.signInDate !== 'string')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse person properties parameter 'signInDate'. Expected type 'string', but got '${value.signInDate}' from type '${typeof value.signInDate}'.`,
                logger
            );
        const signInDate = new Date(value.signInDate);

        // Check if type of isAdmin is boolean
        if (typeof value.isAdmin !== 'boolean')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse person properties parameter 'isAdmin'. Expected type 'boolean', but got '${value.isAdmin}' from type '${typeof value.isAdmin}'.`,
                logger
            );

        // Check if type of name is object
        if (typeof value.name !== 'object')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse person properties parameter 'name'. Expected type 'object', but got '${value.name}' from type '${typeof value.name}'.`,
                logger
            );
        const name = PersonName.fromObject(value.name, logger.nextIndent);

        // Return person properties
        return new PersonPropertiesWithIsAdmin(id, signInDate, value.isAdmin, name);
    }

    /**
     * Builds person properties from specified value.
     * @param { any } value Value to build person properties from.
     * @param { Logger } logger Logger to log this method.
     * @return { PersonPropertiesWithIsAdmin } Builded person properties.
     */
    export function fromValue(value: any, logger: Logger): PersonPropertiesWithIsAdmin {
        logger.append('PersonProperties.fromValue', { value });

        // Check if value is from type object
        if (typeof value !== 'object')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse person properties, expected type 'object', but bot ${value} from type '${typeof value}'`,
                logger
            );

        // Return person properties
        return PersonPropertiesWithIsAdmin.fromObject(value, logger.nextIndent);
    }
}
