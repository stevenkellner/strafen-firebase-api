import { HttpsError, type ILogger } from 'firebase-function';

export type PayedState = {
    state: 'payed';
    payDate: Date;
} | {
    state: 'unpayed';
};

export namespace PayedState {
    export function fromObject(value: object | null, logger: ILogger): PayedState {
        logger.log('PayedState.fromObject', { value: value });

        if (value === null)
            throw HttpsError('internal', 'Couldn\'t get payed state from null.', logger);

        if (!('state' in value) || typeof value.state !== 'string')
            throw HttpsError('internal', 'Couldn\'t get state for fine reason.', logger);

        if (value.state === 'payed') {
            if (!('payDate' in value) || typeof value.payDate !== 'string')
                throw HttpsError('internal', 'Couldn\'t get pay date for fine reason.', logger);

            return {
                state: 'payed',
                payDate: new Date(value.payDate)
            };
        } else if (value.state === 'unpayed') {
            return {
                state: 'unpayed'
            };
        }
        throw HttpsError('internal', 'Invalid state for fine reason.', logger);
    }

    export type Flatten = {
        state: 'payed';
        payDate: string;
    } | {
        state: 'unpayed';
    };

    export function flatten(payedState: PayedState): PayedState.Flatten {
        switch (payedState.state) {
            case 'payed':
                return {
                    state: 'payed',
                    payDate: payedState.payDate.toISOString()
                };
            case 'unpayed':
                return {
                    state: 'unpayed'
                };
        }
    }

    export function concrete(payedState: PayedState.Flatten): PayedState {
        switch (payedState.state) {
            case 'payed':
                return {
                    state: 'payed',
                    payDate: new Date(payedState.payDate)
                };
            case 'unpayed':
                return {
                    state: 'unpayed'
                };
        }
    }
}
