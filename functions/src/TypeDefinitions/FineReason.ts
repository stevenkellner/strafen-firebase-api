import { Amount } from './Amount';
import { Importance } from './Importance';
import { httpsError } from '../utils';
import { Logger } from '../Logger';

/**
 * Contains a reason of a fine, either with a template id or custom with reason message, amount and importance
 */
export class FineReason {

    /**
     * Constructs fine reason with a template id or custom.
     * @param { string } reasonMessage Message of the fine reason.
     * @param { Amount } amount Amount of the fine reason.
     * @param { Importance } importance Importance of the fine reason.
     */
    public constructor(
        public readonly reasonMessage: string,
        public readonly amount: Amount,
        public readonly importance: Importance
    ) { }

    /**
     * Fine reason object that will be stored in the database.
     */
    get databaseObject(): FineReason.DatabaseObject {
        return {
            reasonMessage: this.reasonMessage,
            amount: this.amount.numberValue,
            importance: this.importance.value,
        };
    }

    /**
     * Gets this fine reason for statistic.
     * @return { FineReason.Statistic } This fine reason for statistics.
     */
    get statistic(): FineReason.Statistic {
        return new FineReason.Statistic(this.reasonMessage, this.amount, this.importance);
    }
}

export namespace FineReason {

    /**
     * Builds fine reason from specified value.
     * @param { object } value Value to build fine reason from.
     * @param { Logger } logger Logger to log this method.
     * @return { FineReason } Builded fine reason.
     */
    export function fromObject(value: object & any, logger: Logger): FineReason {
        logger.append('FineReason.fromObject', { value });

        // Check if type of reasonMessage is string
        if (typeof value.reasonMessage !== 'string')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse FineReason parameter 'reasonMessage'. Expected type 'string', but got '${value.reasonMessage}' from type '${typeof value.reasonMessage}'.`,
                logger
            );

        // Check if type of amount is number
        if (typeof value.amount !== 'number')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse FineReason parameter 'amount'. Expected type 'number', but got '${value.amount}' from type '${typeof value.amount}'.`,
                logger
            );
        const amount = Amount.fromNumber(value.amount, logger.nextIndent);

        // Check if type of importance is string
        if (typeof value.importance !== 'string')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse FineReason parameter 'importance'. Expected type 'string', but got '${value.importance}' from type '${typeof value.importance}'.`,
                logger
            );
        const importance = Importance.fromString(value.importance, logger.nextIndent);

        // Return fine reason
        return new FineReason(value.reasonMessage, amount, importance);
    }

    /**
     * Builds fine reason from specified value.
     * @param { any } value Value to build fine reason from.
     * @param { Logger } logger Logger to log this method.
     * @return { FineReason } Builded fine reason.
     */
    export function fromValue(value: any, logger: Logger): FineReason {
        logger.append('FineReason.fromValue', { value });

        // Check if value is from type object.
        if (typeof value !== 'object')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse FineReason, expected type 'object', but bot ${value} from type '${typeof value}'`,
                logger
            );

        // Return fine reason.
        return FineReason.fromObject(value, logger.nextIndent);
    }

    /**
     * Fine reason object that will be stored in the database.
     */
    export interface DatabaseObject {
        reasonMessage: string;
        amount: number;
        importance: string;
    }

    /**
     * Statistic of a fine reason.
     */
    export class Statistic {

        /**
         * Constructs fine reason statistic with id or reason message, amount and importance.
         * @param { string } reasonMessage Reason message of the fine reason.
         * @param { Amount } amount Amount of the fine reason.
         * @param { Importance } importance Importance of the fine reason.
         */
        constructor(
            private readonly reasonMessage: string,
            private readonly amount: Amount,
            private readonly importance: Importance
        ) {}

        /**
         * Fine reason statistic object that will be stored in the database.
         */
        get databaseObject(): Statistic.DatabaseObject {
            return {
                reasonMessage: this.reasonMessage,
                amount: this.amount.numberValue,
                importance: this.importance.value,
            };
        }
    }

    export namespace Statistic {

        /**
         * Fine reason statistic object that will be stored in the database.
         */
        export interface DatabaseObject {

            /**
             * Reason message of the fine reason.
             */
            reasonMessage: string;

            /**
             * Amount of the fine reason.
             */
            amount: number;

            /**
             * Importance of the fine reason.
             */
            importance: string;
        }
    }
}
