import { HttpsError, type ILogger } from 'firebase-function';
import { Amount } from './Amount';
import { Guid } from './Guid';
import { Importance } from './Importance';

export type ReasonTemplate = {
    id: Guid;
    reasonMessage: string;
    amount: Amount;
    importance: Importance;
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

        if (!('importance' in value) || typeof value.importance !== 'string' || !Importance.typeGuard(value.importance))
            throw HttpsError('internal', 'Couldn\'t get importance for reason template.', logger);

        return {
            reasonMessage: value.reasonMessage,
            amount: Amount.fromNumber(value.amount, logger.nextIndent),
            importance: value.importance
        };
    }

    export type Flatten = {
        id: string;
        reasonMessage: string;
        amount: number;
        importance: Importance;
    };

    export function flatten(reasonTemplate: ReasonTemplate): ReasonTemplate.Flatten;
    export function flatten(reasonTemplate: Omit<ReasonTemplate, 'id'>): Omit<ReasonTemplate.Flatten, 'id'>;
    export function flatten(reasonTemplate: ReasonTemplate | Omit<ReasonTemplate, 'id'>): ReasonTemplate.Flatten | Omit<ReasonTemplate.Flatten, 'id'> {
        return {
            ...('id' in reasonTemplate ? { id: reasonTemplate.id.guidString } : {}),
            reasonMessage: reasonTemplate.reasonMessage,
            amount: Amount.flatten(reasonTemplate.amount),
            importance: reasonTemplate.importance
        };
    }

    export function concrete(reasonTemplate: ReasonTemplate.Flatten): ReasonTemplate;
    export function concrete(reasonTemplate: Omit<ReasonTemplate.Flatten, 'id'>): Omit<ReasonTemplate, 'id'>;
    export function concrete(reasonTemplate: ReasonTemplate.Flatten | Omit<ReasonTemplate.Flatten, 'id'>): ReasonTemplate | Omit<ReasonTemplate, 'id'> {
        return {
            ...('id' in reasonTemplate ? { id: new Guid(reasonTemplate.id) } : {}),
            reasonMessage: reasonTemplate.reasonMessage,
            amount: Amount.concrete(reasonTemplate.amount),
            importance: reasonTemplate.importance
        };
    }
}
