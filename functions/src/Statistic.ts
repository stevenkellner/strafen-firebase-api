import { guid } from './TypeDefinitions/guid';
import { Logger } from './Logger';
import { reference } from './utils';
import { ParameterContainer } from './ParameterContainer';

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
 * @param { guid } clubId Id of the club to save statistic to.
 * @param { ParameterContainer } parameterContainer Parameter container of the firebase function to get the reference
 * to the statistic in the database.
 * @param { Logger } logger Logger to log this method.
 */
export async function saveStatistic<
    Properties extends IStatisticProperty<StatisticDatabaseObject<Properties>>
>(
    statistic: IStatistic<Properties>,
    clubId: guid,
    parameterContainer: ParameterContainer,
    logger: Logger
) {
    logger.append('saveStatistic', { statistic });

    // Get reference to statistic.
    const path = `${clubId.guidString}/statistics/${guid.newGuid().guidString}`;
    const statisticReference = reference(path, parameterContainer, logger.nextIndent);

    // Set statistic identifier, property and timestamp.
    await statisticReference.set({
        identifier: statistic.identifier,
        property: statistic.property.databaseObject,
        timestamp: new Date().toISOString(),
    });
}
