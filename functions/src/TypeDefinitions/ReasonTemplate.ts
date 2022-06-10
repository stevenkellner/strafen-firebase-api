import { Importance } from './Importance';
import { ParameterContainer } from '../ParameterContainer';
import { Amount } from './Amount';
import { guid } from './guid';
import { Deleted, httpsError, DataSnapshot } from '../utils';
import { Logger } from '../Logger';

/**
 * Reason template with id, reason message, amount and importance.
 */
export class ReasonTemplate {

    /**
     * Constructs reason template with id, reason message, amount and importance.
     * @param { guid } id Id of the reason.
     * @param { string } reasonMessage Message of the reason.
     * @param { Amount } amount Amount if the reason.
     * @param { Importance } importance Importance of the reason.
     */
    public constructor(
        public readonly id: guid,
        public readonly reasonMessage: string,
        public readonly amount: Amount,
        public readonly importance: Importance
    ) {}

    /**
     * Reason object without id that will be stored in the database.
     */
    get databaseObjectWithoutId(): ReasonTemplate.DatabaseObjectWithoutId {
        return {
            reasonMessage: this.reasonMessage,
            amount: this.amount.numberValue,
            importance: this.importance.value,
        };
    }

    /**
     * Reason object that will be stored in the database.
     */
    get databaseObject(): ReasonTemplate.DatabaseObject {
        return {
            id: this.id.guidString,
            ...this.databaseObjectWithoutId,
        };
    }

    /**
     * Gets this reason for statistics.
     */
    public get statistic(): ReasonTemplate.Statistic {
        return new ReasonTemplate.Statistic(this.id, this.reasonMessage, this.amount, this.importance);
    }
}

export namespace ReasonTemplate {

    /**
     * Reason object without id that will be stored in the database.
     */
    export interface DatabaseObjectWithoutId {

        /**
         * Message of the reason.
         */
        reasonMessage: string;

        /**
         * Amount of the reason
         */
        amount: number;

        /**
         * Importance of the reason.
         */
        importance: string;
    }

    /**
     * Reason object that will be stored in the database.
     */
    export type DatabaseObject = { id: string } & DatabaseObjectWithoutId;

    /**
     * Builds reason template from specified value.
     * @param { object } value Value to build reason template from.
     * @param { Logger } logger Logger to log this method.
     * @return { ReasonTemplate | Deleted<guid> } Builded reason template.
     */
    export function fromObject(value: object & any, logger: Logger): ReasonTemplate | Deleted<guid> {
        logger.append('ReasonTemplate.fromObject', { value });

        // Check if type of id is string
        if (typeof value.id !== 'string')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse ReasonTemplate parameter 'id'. Expected type 'string', but got '${value.id}' 
                from type '${typeof value.id}'.`,
                logger
            );
        const id = guid.fromString(value.id, logger.nextIndent);

        // Check if reason template is deleted
        if (typeof value.deleted !== 'undefined') {
            if (typeof value.deleted !== 'boolean' || !value.deleted)
                throw httpsError(
                    'invalid-argument',
                    'Couldn\'t parse ReasonTemplate, deleted argument wasn\'t from type boolean or was false.',
                    logger
                );
            return new Deleted(id);
        }

        // Check if type of reasonMessage is string
        if (typeof value.reasonMessage !== 'string')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse ReasonTemplate parameter 'reason'. Expected type 'string', but got 
                '${value.reasonMessage}' from type '${typeof value.reasonMessage}'.`,
                logger
            );

        // Check if type of amount is number
        if (typeof value.amount !== 'number')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse ReasonTemplate parameter 'amount'. Expected type 'number', but got '${value.amount}' 
                from type '${typeof value.amount}'.`,
                logger
            );
        const amount = Amount.fromNumber(value.amount, logger.nextIndent);

        // Check if type of importance is string
        if (typeof value.importance !== 'string')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse ReasonTemplate parameter 'importance'. Expected type 'string', but got 
                '${value.importance}' from type '${typeof value.importance}'.`,
                logger
            );
        const importance = Importance.fromString(value.importance, logger.nextIndent);

        // Return reason template
        return new ReasonTemplate(id, value.reasonMessage, amount, importance);
    }

    /**
     * Builds reason template from specified value.
     * @param { any } value Value to build reason template from.
     * @param { Logger } logger Logger to log this method.
     * @return { ReasonTemplate | Deleted<guid> } Builded reason template.
     */
    export function fromValue(value: any, logger: Logger): ReasonTemplate | Deleted<guid> {
        logger.append('ReasonTemplate.fromValue', { value });

        // Check if value is from type object
        if (typeof value !== 'object')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse ReasonTemplate, expected type 'object', but bot ${value} from type '${typeof value}'`,
                logger
            );

        // Return reason template
        return ReasonTemplate.fromObject(value, logger.nextIndent);
    }

    /**
     * Builds reason template from specified snapshot.
     * @param { DataSnapshot } snapshot Snapshot to build reason template from.
     * @param { Logger } logger Logger to log this method.
     * @return { ReasonTemplate | Deleted<guid> } Builded reason template.
     */
    export function fromSnapshot(snapshot: DataSnapshot, logger: Logger): ReasonTemplate | Deleted<guid> {
        logger.append('ReasonTemplate.fromSnapshot', { snapshot });

        // Check if data exists in snapshot
        if (!snapshot.exists())
            throw httpsError(
                'invalid-argument',
                'Couldn\'t parse ReasonTemplate since no data exists in snapshot.',
                logger
            );

        // Get id
        const idString = snapshot.key;
        if (idString == null)
            throw httpsError(
                'invalid-argument',
                'Couldn\'t parse ReasonTemplate since snapshot has an invalid key.',
                logger
            );

        // Get data from snapshot
        const data = snapshot.val();
        if (typeof data !== 'object')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse ReasonTemplate from snapshot since data isn't an object: ${data}`,
                logger
            );

        return ReasonTemplate.fromObject({
            id: idString,
            ...data,
        }, logger.nextIndent);
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * @deprecated Use `container.parameter(parameterName, 'object', logger.nextIndent,
     * ReasonTemplate.fromObject)` instead.
     */
    export function fromParameterContainer(
        container: ParameterContainer,
        parameterName: string,
        logger: Logger
    ): ReasonTemplate | Deleted<guid> {
        logger.append('ReasonTemplate.fromParameterContainer', { container, parameterName });

        // Build and return reason template.
        return ReasonTemplate.fromObject(
            container.parameter(parameterName, 'object', logger.nextIndent),
            logger.nextIndent
        );
    }

    /**
     * Statistic of a reason.
     */
    export class Statistic {

        /**
         * Constructs statistic with id and name.
         * @param { guid } id Id of the statisitc reason.
         * @param { string } reasonMessage Message of the statisitc reason.
         * @param { Amount } amount Amount if the statisitc reason.
         * @param { Importance } importance Importance of the statisitc reason.
         */
        public constructor(
            public readonly id: guid,
            public readonly reasonMessage: string,
            public readonly amount: Amount,
            public readonly importance: Importance
        ) { }

        /**
         * Reason statistic object that will be stored in the database.
         */
        get databaseObject(): ReasonTemplate.Statistic.DatabaseObject {
            return {
                id: this.id.guidString,
                reasonMessage: this.reasonMessage,
                amount: this.amount.numberValue,
                importance: this.importance.value,
            };
        }
    }

    export namespace Statistic {

        /**
         * Reason statistic object that will be stored in the database.
         */
        export interface DatabaseObject {

            /**
             * Id of the statistic reason.
             */
            id: string;

            /**
             * Message of the statistic reason.
             */
            reasonMessage: string;

            /**
             * Amount of the statistic reason
             */
            amount: number;

            /**
             * Importance of the statistic reason.
             */
            importance: string;
        }
    }
}
