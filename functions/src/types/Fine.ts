import { HttpsError, type ILogger } from 'firebase-function';
import { FineReason } from './FineReason';
import { Guid } from './Guid';
import { PayedState } from './PayedState';

export type Fine = {
    id: Guid;
    personId: Guid;
    payedState: PayedState;
    number: number;
    date: Date;
    fineReason: FineReason;
};

export namespace Fine {
    export function fromObject(value: object | null, logger: ILogger): Omit<Fine, 'id'> {
        logger.log('Fine.fromObject', { value: value });

        if (value === null)
            throw HttpsError('internal', 'Couldn\'t get fine from null.', logger);

        if (!('personId' in value) || typeof value.personId !== 'string')
            throw HttpsError('internal', 'Couldn\'t get person id for fine.', logger);

        if (!('payedState' in value) || typeof value.payedState !== 'object')
            throw HttpsError('internal', 'Couldn\'t get payed state for fine.', logger);

        if (!('number' in value) || typeof value.number !== 'number' || !Number.isInteger(value.number))
            throw HttpsError('internal', 'Couldn\'t get number for fine.', logger);

        if (!('date' in value) || typeof value.date !== 'string')
            throw HttpsError('internal', 'Couldn\'t get date for fine.', logger);

        if (!('fineReason' in value) || typeof value.fineReason !== 'object')
            throw HttpsError('internal', 'Couldn\'t get fine reason for fine.', logger);

        return {
            personId: new Guid(value.personId),
            payedState: PayedState.fromObject(value.payedState, logger.nextIndent),
            number: value.number,
            date: new Date(value.date),
            fineReason: FineReason.fromObject(value.fineReason, logger.nextIndent)
        };
    }

    export type Flatten = {
        id: string;
        personId: string;
        payedState: PayedState.Flatten;
        number: number;
        date: string;
        fineReason: FineReason.Flatten;
    };

    export function flatten(fine: Fine): Fine.Flatten;
    export function flatten(fine: Omit<Fine, 'id'>): Omit<Fine.Flatten, 'id'>;
    export function flatten(fine: Fine | Omit<Fine, 'id'>): Fine.Flatten | Omit<Fine.Flatten, 'id'> {
        return {
            ...('id' in fine ? { id: fine.id.guidString } : {}),
            personId: fine.personId.guidString,
            payedState: PayedState.flatten(fine.payedState),
            number: fine.number,
            date: fine.date.toISOString(),
            fineReason: FineReason.flatten(fine.fineReason)
        };
    }

    export function concrete(fine: Fine.Flatten): Fine;
    export function concrete(fine: Omit<Fine.Flatten, 'id'>): Omit<Fine, 'id'>;
    export function concrete(fine: Fine.Flatten | Omit<Fine.Flatten, 'id'>): Fine | Omit<Fine, 'id'> {
        return {
            ...('id' in fine ? { id: new Guid(fine.id) } : {}),
            personId: new Guid(fine.personId),
            payedState: PayedState.concrete(fine.payedState),
            number: fine.number,
            date: new Date(fine.date),
            fineReason: FineReason.concrete(fine.fineReason)
        };
    }
}
