import { HttpsError, UtcDate, type ILogger } from 'firebase-function';
import { Guid } from './Guid';
import { PayedState } from './PayedState';
import { Person } from './Person';
import { PersonName } from './PersonName';
import { FineAmount } from './FineAmount';

export type Fine = {
    id: Guid;
    personId: Guid;
    payedState: PayedState;
    date: UtcDate;
    reasonMessage: string;
    amount: FineAmount;
};

export namespace Fine {
    export function fromObjectWithId(value: object | null, logger: ILogger): Fine {
        logger.log('Fine.fromObject', { value: value });

        if (value === null)
            throw HttpsError('internal', 'Couldn\'t get fine from null.', logger);

        if (!('id' in value) || typeof value.id !== 'string')
            throw HttpsError('internal', 'Couldn\'t get id for fine.', logger);

        return { 
            ... Fine.fromObject(value, logger.nextIndent),
            id: Guid.fromString(value.id, logger.nextIndent),
        };
    }

    export function fromObject(value: object | null, logger: ILogger): Omit<Fine, 'id'> {
        logger.log('Fine.fromObject', { value: value });

        if (value === null)
            throw HttpsError('internal', 'Couldn\'t get fine from null.', logger);

        if (!('personId' in value) || typeof value.personId !== 'string')
            throw HttpsError('internal', 'Couldn\'t get person id for fine.', logger);

        if (!('payedState' in value) || typeof value.payedState !== 'string')
            throw HttpsError('internal', 'Couldn\'t get payed state for fine.', logger);
        if (!PayedState.typeGuard(value.payedState))
            throw HttpsError('internal', 'Couldn\'t get payed state for fine.', logger);

        if (!('date' in value) || typeof value.date !== 'string')
            throw HttpsError('internal', 'Couldn\'t get date for fine.', logger);

        if (!('reasonMessage' in value) || typeof value.reasonMessage !== 'string')
            throw HttpsError('internal', 'Couldn\'t get reason message for fine.', logger);

        if (!('amount' in value))
            throw HttpsError('internal', 'Couldn\'t get amount for fine.', logger);

        return {
            personId: new Guid(value.personId),
            payedState: value.payedState,
            date: UtcDate.decode(value.date),
            reasonMessage: value.reasonMessage,
            amount: FineAmount.fromUnknown(value.amount, logger.nextIndent)
        };
    }

    export function description(fine: Omit<Fine, 'id'>, person: Omit<Person, 'id'>): string {
        return `${fine.reasonMessage} (${FineAmount.description(fine.amount)}, ${PersonName.description(person.name)}, ${PayedState.description(fine.payedState)}, ${fine.date.description('de-DE', 'Europe/Berlin')})`;
    }

    export type Flatten = {
        id: string;
        personId: string;
        payedState: PayedState;
        date: string;
        reasonMessage: string;
        amount: FineAmount.Flatten;
    };

    export function flatten(fine: Fine): Fine.Flatten;
    export function flatten(fine: Omit<Fine, 'id'>): Omit<Fine.Flatten, 'id'>;
    export function flatten(fine: Fine | Omit<Fine, 'id'>): Fine.Flatten | Omit<Fine.Flatten, 'id'> {
        return {
            ...('id' in fine ? { id: fine.id.guidString } : {}),
            personId: fine.personId.guidString,
            payedState: fine.payedState,
            date: fine.date.encoded,
            reasonMessage: fine.reasonMessage,
            amount: FineAmount.flatten(fine.amount)
        };
    }

    export function concrete(fine: Fine.Flatten): Fine;
    export function concrete(fine: Omit<Fine.Flatten, 'id'>): Omit<Fine, 'id'>;
    export function concrete(fine: Fine.Flatten | Omit<Fine.Flatten, 'id'>): Fine | Omit<Fine, 'id'> {
        return {
            ...('id' in fine ? { id: new Guid(fine.id) } : {}),
            personId: new Guid(fine.personId),
            payedState: fine.payedState,
            date: UtcDate.decode(fine.date),
            reasonMessage: fine.reasonMessage,
            amount: FineAmount.concrete(fine.amount)
        };
    }
}
