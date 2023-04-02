import { HttpsError, type ILogger } from 'firebase-function';
import { Amount } from './Amount';
import { Importance } from './Importance';

export type FineReason = {
    reasonMessage: string;
    amount: Amount;
    importance: Importance;
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

        if (!('importance' in value) || typeof value.importance !== 'string' || !Importance.typeGuard(value.importance))
            throw HttpsError('internal', 'Couldn\'t get importance for fine reason.', logger);

        return {
            reasonMessage: value.reasonMessage,
            amount: Amount.fromNumber(value.amount, logger.nextIndent),
            importance: value.importance
        };
    }

    export type Flatten = {
        reasonMessage: string;
        amount: number;
        importance: Importance;
    };

    export function flatten(fineReason: FineReason): FineReason.Flatten {
        return {
            reasonMessage: fineReason.reasonMessage,
            amount: Amount.flatten(fineReason.amount),
            importance: fineReason.importance
        };
    }

    export function concrete(fineReason: FineReason.Flatten): FineReason {
        return {
            reasonMessage: fineReason.reasonMessage,
            amount: Amount.concrete(fineReason.amount),
            importance: fineReason.importance
        };
    }
}
