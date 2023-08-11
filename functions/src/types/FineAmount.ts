import { HttpsError, ILogger } from "firebase-function";
import { Amount } from "./Amount";
import { FineAmountItem } from "./FineAmountItem";

export type FineAmount = Amount |  {
    item: FineAmountItem;
    count: number;
};

export namespace FineAmount {
    export function fromUnknown(value: unknown, logger: ILogger): FineAmount {
        logger.log('FineAmount.fromUnknown', { value: value });

        if (typeof value === 'number')
            return Amount.fromNumber(value, logger.nextIndent);

        if (typeof value === 'object' && value !== null) {

            if (!('item' in value) || typeof value.item !== 'string' || !FineAmountItem.typeGuard(value.item))
                throw HttpsError('internal', 'Couldn\'t get item id for fine amount.', logger);

            if (!('count' in value) || typeof value.count !== 'number'|| !Number.isInteger(value.count))
                throw HttpsError('internal', 'Couldn\'t get count for fine amount.', logger);

            return {
                item: value.item,
                count: value.count
            };
        }

        throw HttpsError('internal', `Couldn't get fine amount from ${typeof value}.`, logger);
    }

    export function description(fineAmount: FineAmount): string {
        if ('item' in fineAmount) {
            return `${fineAmount.count} ${FineAmountItem.description(fineAmount.item)}`;
        } else {
            return Amount.description(fineAmount);
        }
    }

    export type Flatten = Amount.Flatten | {
        item: FineAmountItem;
        count: number;
    };

    export function flatten(fineAmount: FineAmount): FineAmount.Flatten {
        if ('item' in fineAmount) {
            return fineAmount;
        } else {
            return Amount.flatten(fineAmount);
        }
    }

    export function concrete(fineAmount: FineAmount.Flatten): FineAmount {
        if (typeof fineAmount === 'object' && 'item' in fineAmount) {
            return fineAmount;
        } else {
            return Amount.concrete(fineAmount);
        }
    }
}