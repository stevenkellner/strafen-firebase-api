import { HttpsError, type ILogger } from 'firebase-function';
import { Guid } from './Guid';
import { ReasonTemplateCountsItem } from './ReasonTemplateCountsItem';
import { FineAmount } from './FineAmount';

export type ReasonTemplate = {
    id: Guid;
    reasonMessage: string;
    amount: FineAmount;
    counts?: {
        item: ReasonTemplateCountsItem;
        maxCount?: number;
    };
};

export namespace ReasonTemplate {
    export function fromObjectWithId(value: object | null, logger: ILogger): ReasonTemplate {
        logger.log('ReasonTemplate.fromObject', { value: value });

        if (value === null)
            throw HttpsError('internal', 'Couldn\'t get reason template from null.', logger);

        if (!('id' in value) || typeof value.id !== 'string')
            throw HttpsError('internal', 'Couldn\'t get id for reason template.', logger);

        return { 
            ... ReasonTemplate.fromObject(value, logger.nextIndent),
            id: Guid.fromString(value.id, logger.nextIndent),
        };
    }

    export function fromObject(value: object | null, logger: ILogger): Omit<ReasonTemplate, 'id'> {
        logger.log('ReasonTemplate.fromObject', { value: value });

        if (value === null)
            throw HttpsError('internal', 'Couldn\'t get reason template from null.', logger);

        if (!('reasonMessage' in value) || typeof value.reasonMessage !== 'string')
            throw HttpsError('internal', 'Couldn\'t get reason message for reason template.', logger);

        if (!('amount' in value))
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
            amount: FineAmount.fromUnknown(value.amount, logger.nextIndent),
            counts: counts
        };
    }

    export function description(reasonTemplate: Omit<ReasonTemplate, 'id'>): string {
        if (reasonTemplate.counts === undefined)
            return `${reasonTemplate.reasonMessage} (${FineAmount.description(reasonTemplate.amount)})`;
        if (reasonTemplate.counts.maxCount === undefined)
            return `${reasonTemplate.reasonMessage} (pro ${ReasonTemplateCountsItem.description(reasonTemplate.counts.item)}, ${FineAmount.description(reasonTemplate.amount)})`;
        return `${reasonTemplate.reasonMessage} (pro ${ReasonTemplateCountsItem.description(reasonTemplate.counts.item)}, max. ${reasonTemplate.counts.maxCount}, ${FineAmount.description(reasonTemplate.amount)})`;
    }

    export type Flatten = {
        id: string;
        reasonMessage: string;
        amount: FineAmount.Flatten;
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
            amount: FineAmount.flatten(reasonTemplate.amount),
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
            amount: FineAmount.concrete(reasonTemplate.amount),
            counts: reasonTemplate.counts === null
                ? undefined
                : {
                    item: reasonTemplate.counts.item,
                    maxCount: reasonTemplate.counts.maxCount === null ? undefined : reasonTemplate.counts.maxCount
                }
        };
    }
}
