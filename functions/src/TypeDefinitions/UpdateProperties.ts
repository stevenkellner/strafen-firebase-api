import { httpsError } from '../utils';
import { guid } from './guid';
import { Logger } from '../Logger';

/**
 * Update properties with timespamp and person id.
 */
export class UpdateProperties {

    /**
     * Constructs ppdate properties with timespamp and person id.
     * @param { Date } timestamp Timestamp of the database update.
     * @param { guid } personId of the person that updates database.
     */
    constructor(
        public readonly timestamp: Date,
        private readonly personId: guid
    ) { }

    /**
     * Update properties object that will be stored in the database.
     */
    get databaseObject(): UpdateProperties.DatabaseObject {
        return {
            timestamp: this.timestamp.toISOString(),
            personId: this.personId.guidString,
        };
    }
}

export namespace UpdateProperties {

    /**
     * Update properties that will be stored in the database.
     */
    export interface DatabaseObject {

        /**
         * Timestamp of the database update.
         */
        timestamp: string;

        /**
         * Id of the person that updates database.
         */
        personId: string;
    }

    /**
     * Builds update properties from specified value.
     * @param { object } value Value to build update properties from.
     * @param { Logger } logger Logger to log this method.
     * @return { UpdateProperties } Builded update properties.
     */
    export function fromObject(value: object & any, logger: Logger): UpdateProperties {
        logger.append('UpdateProperties.fromObject', { value });

        // Check if person id is string
        if (typeof value.personId !== 'string')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse UpdateProperties parameter 'personId', expected type string but got 
                '${value.personId}' from type ${typeof value.personId}`,
                logger
            );
        const personId = guid.fromString(value.personId, logger.nextIndent);

        // Check if timestamp is a iso string
        if (typeof value.timestamp !== 'string' || isNaN(new Date(value.timestamp).getTime()))
            throw httpsError(
                'invalid-argument',
                `Couldn't parse UpdateProperties parameter 'timestamp', expected iso string but got 
                '${value.timestamp}' from type ${typeof value.timestamp}`,
                logger
            );

        // Return update properties
        return new UpdateProperties(new Date(value.timestamp), personId);
    }

    /**
     * Builds update properties from specified value.
     * @param { any } value Value to build update properties from.
     * @param { Logger } logger Logger to log this method.
     * @return { UpdateProperties } Builded update properties.
     */
    export function fromValue(value: any, logger: Logger): UpdateProperties {
        logger.append('UpdateProperties.fromValue', { value });

        // Check if value is from type object
        if (typeof value !== 'object')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse update properties, expected type 'object', but bot ${value} from type 
                '${typeof value}'`,
                logger
            );

        // Return update properties
        return UpdateProperties.fromObject(value, logger.nextIndent);
    }
}

/**
 * Updatable type that can be stored in the database.
 */
interface UpdatableType<DatabaseObject> {

    /**
     * Object that will be stored in the database.
     */
    databaseObject: DatabaseObject;
}

// Database object that will be stored in the database.
type DatabaseObjectOf<Updatable> =
    Updatable extends UpdatableType<infer DatabaseObject>
        ? DatabaseObject
        : never;

/**
 * Type that can be updated and stored in the database.
 */
export class Updatable<T extends UpdatableType<DatabaseObjectOf<T>>> {

    /**
     * Constructs updatable with property and update properties.
     * @param { T } property Updated property.
     * @param { UpdateProperties } updateProperties Update properties.
     */
    constructor(
        public property: T,
        public updateProperties: UpdateProperties,
    ) {}

    /**
     * Updatable object that will be stored in the database.
     */
    get databaseObject(): Updatable.DatabaseObject<DatabaseObjectOf<T>> {
        return {
            ...this.property.databaseObject,
            updateProperties: this.updateProperties.databaseObject,
        };
    }
}

export namespace Updatable {

    /**
     * Updatable that will be stored in the database.
     */
    export type DatabaseObject<T> = T & {
        updateProperties: UpdateProperties.DatabaseObject,
    }

    /**
     * Builds updatable type from raw property.
     * @template T Type of property of updatable to build.
     * @param { object } rawProperty Raw property to also get updateProperties from.
     * @param { function(value: object, logger: Logger): T } propertyBuilder Builds property of updatable to build.
     * @param { Logger } logger Logger to log this method.
     * @return { Updatable<T> } Builded updatable type.
     */
    export function fromRawProperty<
        T extends UpdatableType<DatabaseObjectOf<T>>
    >(
        rawProperty: object,
        propertyBuilder: (value: object, logger: Logger) => T,
        logger: Logger,
    ): Updatable<T> {
        return new Updatable(
            propertyBuilder(rawProperty, logger.nextIndent),
            UpdateProperties.fromValue((rawProperty as { updateProperties?: any }).updateProperties, logger.nextIndent),
        );
    }
}
