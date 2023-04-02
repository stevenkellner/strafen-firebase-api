import { HttpsError, type ILogger } from 'firebase-function';

export type LatePaymentInterest = {
    interestFreePeriod: LatePaymentInterest.TimePeriod;
    interestPeriod: LatePaymentInterest.TimePeriod;
    interestRate: number;
    compoundInterest: boolean;
};

export namespace LatePaymentInterest {
    export type TimePeriod = {
        value: number;
        unit: 'day' | 'month' | 'year';
    };

    export namespace TimePeriod {
        export function fromObject(value: object | null, logger: ILogger): TimePeriod {
            logger.log('TimePeriod.fromObject', { value: value });

            if (value === null)
                throw HttpsError('internal', 'Couldn\'t get time period from null.', logger);

            if (!('value' in value) || typeof value.value !== 'number' || !Number.isInteger(value.value))
                throw HttpsError('internal', 'Couldn\'t get value for time period.', logger);

            if (!('unit' in value) || !(value.unit === 'day' || value.unit === 'month' || value.unit === 'year'))
                throw HttpsError('internal', 'Couldn\'t get unit for time period.', logger);

            return {
                value: value.value,
                unit: value.unit
            };
        }
    }

    export function fromObject(value: object | null, logger: ILogger): LatePaymentInterest {
        logger.log('LatePaymentInterest.fromObject', { value: value });

        if (value === null)
            throw HttpsError('internal', 'Couldn\'t get late payment interest from null.', logger);

        if (!('interestFreePeriod' in value) || typeof value.interestFreePeriod !== 'object')
            throw HttpsError('internal', 'Couldn\'t get interest free period for late payment interest.', logger);

        if (!('interestPeriod' in value) || typeof value.interestPeriod !== 'object')
            throw HttpsError('internal', 'Couldn\'t get interest period for late payment interest.', logger);

        if (!('interestRate' in value) || typeof value.interestRate !== 'number')
            throw HttpsError('internal', 'Couldn\'t get interest rate for late payment interest.', logger);

        if (!('compoundInterest' in value) || typeof value.compoundInterest !== 'boolean')
            throw HttpsError('internal', 'Couldn\'t get compound interest for late payment interest.', logger);

        return {
            interestFreePeriod: TimePeriod.fromObject(value.interestFreePeriod, logger.nextIndent),
            interestPeriod: TimePeriod.fromObject(value.interestPeriod, logger.nextIndent),
            interestRate: value.interestRate,
            compoundInterest: value.compoundInterest
        };
    }
}
