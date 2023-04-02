import { HttpsError, type ILogger } from 'firebase-function';
import { Guid } from './Guid';
import { PersonName } from './PersonName';

export type Person = {
    id: Guid;
    name: PersonName;
    fineIds: Guid[];
    signInData?: {
        hashedUserId: string;
        signInDate: Date;
    };
};

export namespace Person {
    export function fromObject(value: object | null, logger: ILogger): Omit<Person, 'id'> {
        logger.log('Person.fromObject', { value: value });

        if (value === null)
            throw HttpsError('internal', 'Couldn\'t get person from null.', logger);

        if (!('name' in value) || typeof value.name !== 'object')
            throw HttpsError('internal', 'Couldn\'t get name for person.', logger);

        if (!('fineIds' in value) || typeof value.fineIds !== 'object' || !Array.isArray(value.fineIds))
            throw HttpsError('internal', 'Couldn\'t get fine ids for person.', logger);
        const fineIds = value.fineIds.map((fineId: unknown) => {
            if (typeof fineId !== 'string')
                throw HttpsError('internal', 'Couldn\'t get fine ids for person.', logger);
            return Guid.fromString(fineId, logger.nextIndent);
        });

        if ('signInData' in value && ((typeof value.signInData !== 'object' || value.signInData === null) && value.signInData !== undefined))
            throw HttpsError('internal', 'Couldn\'t get sign in data for person.', logger);

        if ('signInData' in value && (!('hashedUserId' in (value.signInData as object)) || typeof (value.signInData as Record<'hashedUserId', unknown>).hashedUserId !== 'string'))
            throw HttpsError('internal', 'Couldn\'t get hashed user id of sign in data for person.', logger);

        if ('signInData' in value && (!('signInDate' in (value.signInData as object)) || typeof (value.signInData as Record<'signInDate', unknown>).signInDate !== 'string'))
            throw HttpsError('internal', 'Couldn\'t get sign in date of sign in data for person.', logger);

        return {
            name: PersonName.fromObject(value.name, logger.nextIndent),
            fineIds: fineIds,
            signInData: 'signInData' in value
                ? {
                    hashedUserId: (value.signInData as Record<'hashedUserId', string>).hashedUserId,
                    signInDate: new Date((value.signInData as Record<'signInDate', string>).signInDate)
                }
                : undefined
        };
    }

    export type Flatten = {
        id: string;
        name: PersonName.Flatten;
        fineIds: string[];
        signInData: {
            hashedUserId: string;
            signInDate: string;
        } | null;
    };

    export function flatten(person: Person): Person.Flatten;
    export function flatten(person: Omit<Person, 'id'>): Omit<Person.Flatten, 'id'>;
    export function flatten(person: Person | Omit<Person, 'id'>): Person.Flatten | Omit<Person.Flatten, 'id'> {
        return {
            ...('id' in person ? { id: person.id.guidString } : {}),
            name: PersonName.flatten(person.name),
            fineIds: person.fineIds.map(fineId => fineId.guidString),
            signInData: person.signInData === undefined
                ? null
                : {
                    hashedUserId: person.signInData.hashedUserId,
                    signInDate: person.signInData.signInDate.toISOString()
                }
        };
    }

    export function concrete(person: Person.Flatten): Person;
    export function concrete(person: Omit<Person.Flatten, 'id'>): Omit<Person, 'id'>;
    export function concrete(person: Person.Flatten | Omit<Person.Flatten, 'id'>): Person | Omit<Person, 'id'> {
        return {
            ...('id' in person ? { id: new Guid(person.id) } : {}),
            name: PersonName.concrete(person.name),
            fineIds: person.fineIds.map(fineId => new Guid(fineId)),
            signInData: person.signInData === null
                ? undefined
                : {
                    hashedUserId: person.signInData.hashedUserId,
                    signInDate: new Date(person.signInData.signInDate)
                }
        };
    }
}
