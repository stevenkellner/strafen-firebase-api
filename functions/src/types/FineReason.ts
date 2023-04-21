import { HttpsError, type ILogger } from 'firebase-function';
import { Amount } from './Amount';

export type FineReason = {
    reasonMessage: string;
    amount: Amount;
};

export namespace FineReason {
    export function fromObject(value: object | null, logger: ILogger): FineReason {
        logger.log('FineReason.fromObject', { value: value });

        if (value === null)
            throw HttpsError('internal', 'Couldn\'t get fine reason from null.', logger);

        if (!('reasonMessage' in value) || typeof value.reasonMessage !== 'string')
            throw HttpsError('internal', 'Couldn\'t get reason message for fine reason.', logger);

        if (!('amount' in value) || typeof value.amount !== 'number')
            throw HttpsError('internal', 'Couldn\'t get amount for fine reason.', logger);
        return {
            reasonMessage: value.reasonMessage,
            amount: Amount.fromNumber(value.amount, logger.nextIndent)
        };
    }

    export type Flatten = {
        reasonMessage: string;
        amount: number;
    };

    export function flatten(fineReason: FineReason): FineReason.Flatten {
        return {
            reasonMessage: fineReason.reasonMessage,
            amount: Amount.flatten(fineReason.amount)
        };
    }

    export function concrete(fineReason: FineReason.Flatten): FineReason {
        return {
            reasonMessage: fineReason.reasonMessage,
            amount: Amount.concrete(fineReason.amount)
        };
    }
}
