import { HttpsError, type ILogger } from 'firebase-function';

export type PersonName = {
    first: string;
    last?: string;
};

export namespace PersonName {
    export function fromObject(value: object | null, logger: ILogger): PersonName {
        logger.log('PersonName.fromObject', { value: value });

        if (value === null)
            throw HttpsError('internal', 'Couldn\'t get person name from null.', logger);

        if (!('first' in value) || typeof value.first !== 'string')
            throw HttpsError('internal', 'Couldn\'t get first for person name.', logger);

        if (!('last' in value) || (typeof value.last !== 'string' && value.last !== null))
            throw HttpsError('internal', 'Couldn\'t get last for person name.', logger);

        return {
            first: value.first,
            last: value.last !== null ? value.last : undefined
        };
    }

    export function description(name: PersonName) {
        if (name.last === undefined)
            return name.first;
        return `${name.first} ${name.last}`;
    }

    export type Flatten = {
        first: string;
        last: string | null;
    };

    export function flatten(personName: PersonName): PersonName.Flatten {
        return {
            first: personName.first,
            last: personName.last ?? null
        };
    }

    export function concrete(personName: PersonName.Flatten): PersonName {
        return {
            first: personName.first,
            last: personName.last ?? undefined
        };
    }
}
