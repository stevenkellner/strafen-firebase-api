import { HttpsError, type ILogger } from 'firebase-function';

export type PayedState = {
    state: 'payed';
    inApp: boolean;
    payDate: Date;
} | {
    state: 'unpayed';
} | {
    state: 'settled';
};

export namespace PayedState {
    export function fromObject(value: object | null, logger: ILogger): PayedState {
        logger.log('PayedState.fromObject', { value: value });

        if (value === null)
            throw HttpsError('internal', 'Couldn\'t get payed state from null.', logger);

        if (!('state' in value) || typeof value.state !== 'string')
            throw HttpsError('internal', 'Couldn\'t get state for fine reason.', logger);

        if (value.state === 'payed') {
            if (!('inApp' in value) || typeof value.inApp !== 'boolean')
                throw HttpsError('internal', 'Couldn\'t get inApp for fine reason.', logger);

            if (!('payDate' in value) || typeof value.payDate !== 'string')
                throw HttpsError('internal', 'Couldn\'t get pay date for fine reason.', logger);

            return {
                state: 'payed',
                inApp: value.inApp,
                payDate: new Date(value.payDate)
            };
        } else if (value.state === 'unpayed') {
            return {
                state: 'unpayed'
            };
        } else if (value.state === 'settled') {
            return {
                state: 'settled'
            };
        }
        throw HttpsError('internal', 'Invalid state for fine reason.', logger);
    }

    export type Flatten = {
        state: 'payed';
        inApp: boolean;
        payDate: string;
    } | {
        state: 'unpayed';
    } | {
        state: 'settled';
    };

    export function flatten(payedState: PayedState): PayedState.Flatten {
        switch (payedState.state) {
            case 'payed':
                return {
                    state: 'payed',
                    inApp: payedState.inApp,
                    payDate: payedState.payDate.toISOString()
                };
            case 'unpayed':
                return {
                    state: 'unpayed'
                };
            case 'settled':
                return {
                    state: 'settled'
                };
        }
    }

    export function concrete(payedState: PayedState.Flatten): PayedState {
        switch (payedState.state) {
            case 'payed':
                return {
                    state: 'payed',
                    inApp: payedState.inApp,
                    payDate: new Date(payedState.payDate)
                };
            case 'unpayed':
                return {
                    state: 'unpayed'
                };
            case 'settled':
                return {
                    state: 'settled'
                };
        }
    }
}
