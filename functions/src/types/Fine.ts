import { HttpsError, type ILogger } from 'firebase-function';
import { Guid } from './Guid';
import { PayedState } from './PayedState';
import { Amount } from './Amount';
import { Person } from './Person';
import { PersonName } from './PersonName';

export type Fine = {
    id: Guid;
    personId: Guid;
    payedState: PayedState;
    date: Date;
    reasonMessage: string;
    amount: Amount;
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

        if (!('amount' in value) || typeof value.amount !== 'number')
            throw HttpsError('internal', 'Couldn\'t get amount for fine.', logger);

        return {
            personId: new Guid(value.personId),
            payedState: value.payedState,
            date: new Date(value.date),
            reasonMessage: value.reasonMessage,
            amount: Amount.fromNumber(value.amount, logger.nextIndent)
        };
    }

    export function description(fine: Omit<Fine, 'id'>, person: Omit<Person, 'id'>): string {
        return `${fine.reasonMessage} (${Amount.description(fine.amount)}, ${PersonName.description(person.name)}, ${PayedState.description(fine.payedState)}, ${fine.date.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })})`;
    }

    export type Flatten = {
        id: string;
        personId: string;
        payedState: PayedState;
        date: string;
        reasonMessage: string;
        amount: Amount.Flatten;
    };

    export function flatten(fine: Fine): Fine.Flatten;
    export function flatten(fine: Omit<Fine, 'id'>): Omit<Fine.Flatten, 'id'>;
    export function flatten(fine: Fine | Omit<Fine, 'id'>): Fine.Flatten | Omit<Fine.Flatten, 'id'> {
        return {
            ...('id' in fine ? { id: fine.id.guidString } : {}),
            personId: fine.personId.guidString,
            payedState: fine.payedState,
            date: fine.date.toISOString(),
            reasonMessage: fine.reasonMessage,
            amount: Amount.flatten(fine.amount)
        };
    }

    export function concrete(fine: Fine.Flatten): Fine;
    export function concrete(fine: Omit<Fine.Flatten, 'id'>): Omit<Fine, 'id'>;
    export function concrete(fine: Fine.Flatten | Omit<Fine.Flatten, 'id'>): Fine | Omit<Fine, 'id'> {
        return {
            ...('id' in fine ? { id: new Guid(fine.id) } : {}),
            personId: new Guid(fine.personId),
            payedState: fine.payedState,
            date: new Date(fine.date),
            reasonMessage: fine.reasonMessage,
            amount: Amount.concrete(fine.amount)
        };
    }
}
