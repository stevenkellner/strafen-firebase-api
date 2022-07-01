import { guid } from './TypeDefinitions/guid';
import { Logger } from './Logger';
import { reference } from './utils';
import { DatabaseType } from './TypeDefinitions/DatabaseType';
import { Crypter } from './crypter/Crypter';
import { cryptionKeys } from './privateKeys';

/**
 * Declares an interface for a statistic property that will be stored in the database.
 * @template DatabaseObject Type of the statistic object that will be stored in the database.
 */
export interface IStatisticProperty<DatabaseObject> {

    /**
     * Statistic object that will be stored in the database.
     */
    databaseObject: DatabaseObject;
}

/**
 * Type of the database object in a staticstic property.
 * @template T Statistic property to get the type of the database object.
 */
type StatisticDatabaseObject<T> =
    T extends IStatisticProperty<infer DatabaseObject>
        ? DatabaseObject
        : never;

/**
 * Declares an interface for a statistic of a database update that will be stored in the database.
 * @template Property Property of the statistic of a database update.
 */
export interface IStatistic<Property extends IStatisticProperty<StatisticDatabaseObject<Property>>> {

    /**
     * Identifier of the statistic of a database update.
     */
    identifier: string;

    /**
     * Property of the statistic of a database update.
     */
    property: Property;
}

/**
 * Saves specifed statistic properties to specified club path.
 * @param { IStatistic } statistic Properties of statistic to save.
 * @param { { clubId: guid, databaseType: DatabaseType } } parameters
 * Id of the club to save statistic to and database type to get the reference
 * to the statistic in the database.
 * @param { Logger } logger Logger to log this method.
 */
export async function saveStatistic<
    Properties extends IStatisticProperty<StatisticDatabaseObject<Properties>>
>(
    statistic: IStatistic<Properties>,
    parameters: {
        clubId: guid,
        databaseType: DatabaseType,
    },
    logger: Logger
) {
    logger.append('saveStatistic', { statistic, parameters });

    // Get reference to statistic.
    const path = `${parameters.clubId.guidString}/statistics/${guid.newGuid().guidString}`;
    const statisticReference = reference(path, parameters.databaseType, logger.nextIndent);

    // Set statistic identifier, property and timestamp.
    const crypter = new Crypter(cryptionKeys(parameters.databaseType));
    await statisticReference.set(crypter.encodeEncrypt({
        identifier: statistic.identifier,
        property: statistic.property.databaseObject,
        timestamp: new Date().toISOString(),
    }));
}
