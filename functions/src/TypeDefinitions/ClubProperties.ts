import { httpsError } from '../utils';
import { guid } from './guid';
import { Logger } from '../Logger';
import { ValidBuilder } from '../ParameterParser';

/**
 * Contains all properties of a club.
 * Valid club properties: `{
 *      id: guid,
 *      name: string,
 *      identifier: string,
 *      regionCode: string,
 *      inAppPaymentActive: boolean
 * }`
 */
export class ClubProperties {

    /**
     * Constructs the club properties with id, name, identifier, region code and in app payment active.
     * @param { guid } id Id of the club.
     * @param { string } name Name of the club.
     * @param { string } identifier Identified of the club.
     * @param { string } regionCode Region code of the club.
     * @param { boolean } inAppPaymentActive Indicates whether in app payment is active.
     */
    public constructor(
        public readonly id: guid,
        public readonly name: string,
        public readonly identifier: string,
        public readonly regionCode: string,
        public readonly inAppPaymentActive: boolean
    ) {}

    /**
     * Club properties object that will be stored in the database.
     */
    public get databaseObject(): ClubProperties.DatabaseObject {
        return {
            id: this.id.guidString,
            name: this.name,
            identifier: this.identifier,
            regionCode: this.regionCode,
            inAppPaymentActive: this.inAppPaymentActive,
        };
    }
}

export namespace ClubProperties {

    /**
     * Properties used to build this type.
     */
    export const buildProperties: ValidBuilder<ClubProperties> = ['object', ClubProperties.fromObject];

    /**
     * Club properties object that will be stored in the database.
     */
    export interface DatabaseObject {

        /**
         * Id of the club.
         */
        id: string,

        /**
         * Name of the club.
         */
        name: string,

        /**
         * Identified of the club.
         */
        identifier: string,

        /**
         * Region code of the club.
         */
        regionCode: string,

        /**
         * Indicates whether in app payment is active.
         */
        inAppPaymentActive: boolean,
    }

    /**
     * Builds club properties from specified value.
     * @param { object } value Value to build club properties from.
     * @param { Logger } logger Logger to log this method.
     * @return { ClubProperties } Builded club properties.
     */
    export function fromObject(value: object & any, logger: Logger): ClubProperties {
        logger.append('ClubProperties.fromObject', { value });

        // Check if type of id is string
        if (typeof value.id !== 'string')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse club properties parameter 'id'. Expected type 'string', but got '${value.id}' from type '${typeof value.id}'.`,
                logger
            );
        const id = guid.fromString(value.id, logger.nextIndent);

        // Check if type of name is string
        if (typeof value.name !== 'string')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse club properties parameter 'name'. Expected type 'string', but got '${value.name}' from type '${typeof value.name}'.`,
                logger
            );

        // Check if type of identifier is string
        if (typeof value.identifier !== 'string')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse club properties parameter 'identifier'. Expected type 'string', but got '${value.identifier}' from type '${typeof value.identifier}'.`,
                logger
            );

        // Check if type of regionCode is string
        if (typeof value.regionCode !== 'string')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse club properties parameter 'regionCode'. Expected type 'string', but got '${value.regionCode}' from type '${typeof value.regionCode}'.`,
                logger
            );

        // Check if type of inAppPaymentActive is boolean
        if (typeof value.inAppPaymentActive !== 'boolean')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse club properties parameter 'inAppPaymentActive'. Expected type 'boolean', but got '${value.inAppPaymentActive}' from type '${typeof value.inAppPaymentActive}'.`,
                logger
            );

        // Return club properties
        return new ClubProperties(id, value.name, value.identifier, value.regionCode, value.inAppPaymentActive);

    }

    /**
     * Builds club properties from specified value.
     * @param { any } value Value to build club properties from.
     * @param { Logger } logger Logger to log this method.
     * @return { ClubProperties } Builded club properties.
     */
    export function fromValue(value: any, logger: Logger): ClubProperties {
        logger.append('ClubProperties.fromValue', { value });

        // Check if value is from type object
        if (typeof value !== 'object')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse club properties, expected type 'object', but bot ${value} from type '${typeof value}'`,
                logger
            );

        // Return club properties
        return ClubProperties.fromObject(value, logger.nextIndent);
    }
}
