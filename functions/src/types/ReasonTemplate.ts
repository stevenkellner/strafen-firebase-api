import { HttpsError, type ILogger } from 'firebase-function';
import { Amount } from './Amount';
import { Guid } from './Guid';
import { ReasonTemplateCountsItem } from './ReasonTemplateCountsItem';

export type ReasonTemplate = {
    id: Guid;
    reasonMessage: string;
    amount: Amount;
    counts?: {
        item: ReasonTemplateCountsItem;
        maxCount?: number;
    };
};

export namespace ReasonTemplate {
    export function fromObject(value: object | null, logger: ILogger): Omit<ReasonTemplate, 'id'> {
        logger.log('ReasonTemplate.fromObject', { value: value });

        if (value === null)
            throw HttpsError('internal', 'Couldn\'t get reason template from null.', logger);

        if (!('reasonMessage' in value) || typeof value.reasonMessage !== 'string')
            throw HttpsError('internal', 'Couldn\'t get reason message for reason template.', logger);

        if (!('amount' in value) || typeof value.amount !== 'number')
            throw HttpsError('internal', 'Couldn\'t get amount for reason template.', logger);

        let counts: {
            item: ReasonTemplateCountsItem;
            maxCount?: number;
        } | undefined;
        if (!('counts' in value) || (typeof value.counts !== 'object' && value.counts !== null))
            throw HttpsError('internal', 'Couldn\'t get counts for reason template.', logger);
        else if (value.counts !== null) {
            if (!('item' in value.counts) || typeof value.counts.item !== 'string' || !ReasonTemplateCountsItem.typeGuard(value.counts.item))
                throw HttpsError('internal', 'Couldn\'t get counts item for reason template.', logger);

            if (!('maxCount' in value.counts) || (typeof value.counts.maxCount !== 'number' && value.counts.maxCount !== null))
                throw HttpsError('internal', 'Couldn\'t get max counts for reason template.', logger);

            counts = {
                item: value.counts.item,
                maxCount: value.counts.maxCount === null ? undefined : value.counts.maxCount
            };
        }

        return {
            reasonMessage: value.reasonMessage,
            amount: Amount.fromNumber(value.amount, logger.nextIndent),
            counts: counts
        };
    }

    export type Flatten = {
        id: string;
        reasonMessage: string;
        amount: number;
        counts: {
            item: ReasonTemplateCountsItem;
            maxCount: number | null;
        } | null;
    };

    export function flatten(reasonTemplate: ReasonTemplate): ReasonTemplate.Flatten;
    export function flatten(reasonTemplate: Omit<ReasonTemplate, 'id'>): Omit<ReasonTemplate.Flatten, 'id'>;
    export function flatten(reasonTemplate: ReasonTemplate | Omit<ReasonTemplate, 'id'>): ReasonTemplate.Flatten | Omit<ReasonTemplate.Flatten, 'id'> {
        return {
            ...('id' in reasonTemplate ? { id: reasonTemplate.id.guidString } : {}),
            reasonMessage: reasonTemplate.reasonMessage,
            amount: Amount.flatten(reasonTemplate.amount),
            counts: reasonTemplate.counts === undefined
                ? null
                : {
                    item: reasonTemplate.counts.item,
                    maxCount: reasonTemplate.counts.maxCount === undefined ? null : reasonTemplate.counts.maxCount
                }
        };
    }

    export function concrete(reasonTemplate: ReasonTemplate.Flatten): ReasonTemplate;
    export function concrete(reasonTemplate: Omit<ReasonTemplate.Flatten, 'id'>): Omit<ReasonTemplate, 'id'>;
    export function concrete(reasonTemplate: ReasonTemplate.Flatten | Omit<ReasonTemplate.Flatten, 'id'>): ReasonTemplate | Omit<ReasonTemplate, 'id'> {
        return {
            ...('id' in reasonTemplate ? { id: new Guid(reasonTemplate.id) } : {}),
            reasonMessage: reasonTemplate.reasonMessage,
            amount: Amount.concrete(reasonTemplate.amount),
            counts: reasonTemplate.counts === null
                ? undefined
                : {
                    item: reasonTemplate.counts.item,
                    maxCount: reasonTemplate.counts.maxCount === null ? undefined : reasonTemplate.counts.maxCount
                }
        };
    }
}
