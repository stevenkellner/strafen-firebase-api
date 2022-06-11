import { Deleted, httpsError, DataSnapshot } from '../utils';
import { Logger } from '../Logger';

/**
 * Late payement interest
 */
export class LatePaymentInterest {

    /**
     * Constructs late payment interest with interestfree period, interest period, interest rate, compound interest.
     * @param { LatePaymentInterest.TimePeriod } interestFreePeriod Interestfree period of the late payment interest.
     * @param { LatePaymentInterest.TimePeriod } interestPeriod Interest period of the late payment interest.
     * @param { number } interestRate Interest rate of the late payment interest.
     * @param { boolean } compoundInterest Compound interest of the late payment interest.
     */
    public constructor(
        public readonly interestFreePeriod: LatePaymentInterest.TimePeriod,
        public readonly interestPeriod: LatePaymentInterest.TimePeriod,
        public readonly interestRate: number,
        public readonly compoundInterest: boolean
    ) {}

    /**
     * Late payment interest object that will be stored in the database.
     */
    public get databaseObject(): LatePaymentInterest.DatabaseObject {
        return {
            interestFreePeriod: this.interestFreePeriod.databaseObject,
            interestPeriod: this.interestPeriod.databaseObject,
            interestRate: this.interestRate,
            compoundInterest: this.compoundInterest,
        };
    }
}

export namespace LatePaymentInterest {

    /**
     * Late payment interest object that will be stored in the database.
     */
    export interface DatabaseObject {

        /**
         * Interestfree period of the late payment interest.
         */
        interestFreePeriod: LatePaymentInterest.TimePeriod.DatabaseObject;

        /**
         * Interest period of the late payment interest.
         */
        interestPeriod: LatePaymentInterest.TimePeriod.DatabaseObject;

        /**
         * Interest rate of the late payment interest.
         */
        interestRate: number;

        /**
         * Compound interest of the late payment interest.
         */
        compoundInterest: boolean;
    }

    /**
     * Builds late payment interest from specified value.
     * @param { object } value Value to build late payment interest from.
     * @param { Logger } logger Logger to log this method.
     * @return { LatePaymentInterest | Deleted<null> } Builded late payment interest.
     */
    export function fromObject(value: object & any, logger: Logger): LatePaymentInterest | Deleted<null> {
        logger.append('LatePaymentInterest.fromObject', { value });

        // Check if interest is deleted
        if (typeof value.deleted !== 'undefined') {
            if (typeof value.deleted !== 'boolean' || !value.deleted)
                throw httpsError(
                    'invalid-argument',
                    'Couldn\'t parse interest, deleted argument wasn\'t from type boolean or was false.',
                    logger
                );
            return new Deleted(null);
        }

        // Check if type of interest free period is time period
        if (typeof value.interestFreePeriod !== 'object')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse LatePaymentInterest parameter 'interestFreePeriod'. Expected type 'object', but got '${value.interestFreePeriod}' from type '${typeof value.interestFreePeriod}'.`,
                logger
            );
        const interestFreePeriod = TimePeriod.fromObject(value.interestFreePeriod, logger.nextIndent);

        // Check if type of interest period is time period
        if (typeof value.interestPeriod !== 'object')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse LatePaymentInterest parameter 'interestPeriod'. Expected type 'object', but got '${value.interestPeriod}' from type '${typeof value.interestPeriod}'.`,
                logger
            );
        const interestPeriod = TimePeriod.fromObject(value.interestPeriod, logger.nextIndent);

        // Check if type of interest rate is number
        if (typeof value.interestRate !== 'number')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse LatePaymentInterest parameter 'interestRate'. Expected type 'number', but got '${value.interestRate}' from type '${typeof value.interestRate}'.`,
                logger
            );

        // Check if type of compound interest is boolean
        if (typeof value.compoundInterest !== 'boolean')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse LatePaymentInterest parameter 'compoundInterest'. Expected type 'boolean', but got '${value.compoundInterest}' from type '${typeof value.compoundInterest}'.`,
                logger
            );

        // Return late payment interest
        return new LatePaymentInterest(interestFreePeriod, interestPeriod, value.interestRate, value.compoundInterest);
    }

    /**
     * Builds late payment interest from specified value.
     * @param { any } value Value to build late payment interest from.
     * @param { Logger } logger Logger to log this method.
     * @return { LatePaymentInterest | Deleted<null> } Builded late payment interest.
     */
    export function fromValue(value: any, logger: Logger): LatePaymentInterest | Deleted<null> {
        logger.append('LatePaymentInterest.fromValue', { value });

        // Check if value is from type object
        if (typeof value !== 'object')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse LatePaymentInterest, expected type 'object', but bot ${value} from type '${typeof value}'`,
                logger
            );

        // Return late payment interest
        return LatePaymentInterest.fromObject(value, logger.nextIndent);
    }

    /**
     * Builds late payment interest from specified snapshot.
     * @param { DataSnapshot } snapshot Snapshot to build late payment interest from.
     * @param { Logger } logger Logger to log this method.
     * @return { LatePaymentInterest | Deleted<null> } Builded late payment interest.
     */
    export function fromSnapshot(snapshot: DataSnapshot, logger: Logger): LatePaymentInterest | Deleted<null> {
        logger.append('LatePaymentInterest.fromSnapshot', { snapshot });

        // Check if data exists in snapshot
        if (!snapshot.exists())
            throw httpsError('invalid-argument', 'Couldn\'t parse Person since no data exists in snapshot.', logger);

        const data = snapshot.val();
        if (typeof data !== 'object')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse Person from snapshot since data isn't an object: ${data}`,
                logger
            );

        return LatePaymentInterest.fromObject(data, logger.nextIndent);
    }

    /**
     * Contains a value and an unit (`day`, `month`, `year`).
     */
    export class TimePeriod {

        /**
         * Constructs the time period with a value and an unit.
         * @param { number } value Value of the time period.
         * @param { 'day' | 'month' | 'year' } unit Unit of the time period.
         */
        public constructor(
            public readonly value: number,
            public readonly unit: 'day' | 'month' | 'year'
        ) { }

        /**
         * Time period object that will be stored in the database.
         */
        public get databaseObject(): LatePaymentInterest.TimePeriod.DatabaseObject {
            return {
                value: this.value,
                unit: this.unit,
            };
        }
    }

    export namespace TimePeriod {

        /**
         * Time period object that will be stored in the database.
         */
        export interface DatabaseObject {

            /**
             * Value of the time period.
             */
            value: number;

            /**
             * Unit of the time period.
             */
            unit: 'day' | 'month' | 'year';
        }

        /**
         * Builds time period from specified value.
         * @param { object } value Value to build time period from.
         * @param { Logger } logger Logger to log this method.
         * @return { TimePeriod } Builded time period.
         */
        export function fromObject(value: object & any, logger: Logger): TimePeriod {
            logger.append('TimePeriod.fromObject', { value });

            // Check if type of value is number
            if (typeof value.value !== 'number')
                throw httpsError(
                    'invalid-argument',
                    // eslint-disable-next-line max-len
                    `Couldn't parse TimePeriod parameter 'value'. Expected type 'number', but got '${value.value}' from type '${typeof value.value}'.`,
                    logger
                );

            // Check if type of unit is boolean
            if (
                typeof value.unit !== 'string' ||
                !(value.unit == 'day' || value.unit == 'month' || value.unit == 'year'))
                throw httpsError(
                    'invalid-argument',
                    // eslint-disable-next-line max-len
                    `Couldn't parse TimePeriod parameter 'unit'. Expected 'day', 'month' or 'year' from type 'string', but got '${value.unit}' from type '${typeof value.unit}'.`,
                    logger
                );

            // Return time period
            return new TimePeriod(value.value, value.unit);
        }

        /**
         * Builds time period from specified value.
         * @param { any } value Value to build time period from.
         * @param { Logger } logger Logger to log this method.
         * @return { TimePeriod } Builded time period.
         */
        export function fromValue(value: any, logger: Logger): TimePeriod {
            logger.append('TimePeriod.fromValue', { value });

            // Check if value is from type object
            if (typeof value !== 'object')
                throw httpsError(
                    'invalid-argument',
                    `Couldn't parse TimePeriod, expected type 'object', but bot ${value} from type '${typeof value}'`,
                    logger
                );

            // Return time period
            return TimePeriod.fromObject(value, logger.nextIndent);
        }
    }
}
