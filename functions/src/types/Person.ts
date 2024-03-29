import { HttpsError, type ILogger } from 'firebase-function';
import { Guid } from './Guid';
import { PersonName } from './PersonName';
import { SignInData } from './SignInData';

export type Person = {
    id: Guid;
    name: PersonName;
    fineIds: Guid[];
    signInData?: SignInData;
    invitationLinkId?: string;
};

export namespace Person {
    export function fromObjectWithId(value: object | null, logger: ILogger): Person {
        logger.log('Person.fromObject', { value: value });

        if (value === null)
            throw HttpsError('internal', 'Couldn\'t get person from null.', logger);

        if (!('id' in value) || typeof value.id !== 'string')
            throw HttpsError('internal', 'Couldn\'t get id for person.', logger);

        return { 
            ... Person.fromObject(value, logger.nextIndent),
            id: Guid.fromString(value.id, logger.nextIndent),
        };
    }

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

        if (!('signInData' in value) || typeof value.signInData !== 'object')
            throw HttpsError('internal', 'Couldn\'t get sign in data for person.', logger);

        if (!('invitationLinkId' in value) || (typeof value.invitationLinkId !== 'string' && value.invitationLinkId !== null))
            throw HttpsError('internal', 'Couldn\'t get invitationLinkId for person.', logger);

        return {
            name: PersonName.fromObject(value.name, logger.nextIndent),
            fineIds: fineIds,
            signInData: SignInData.fromObject(value.signInData, logger.nextIndent),
            invitationLinkId: value.invitationLinkId !== null ? value.invitationLinkId : undefined
        };
    }

    export type Flatten = {
        id: string;
        name: PersonName.Flatten;
        fineIds: string[];
        signInData: SignInData.Flatten | null;
        invitationLinkId: string | null;
    };

    export function flatten(person: Person): Person.Flatten;
    export function flatten(person: Omit<Person, 'id'>): Omit<Person.Flatten, 'id'>;
    export function flatten(person: Person | Omit<Person, 'id'>): Person.Flatten | Omit<Person.Flatten, 'id'> {
        return {
            ...('id' in person ? { id: person.id.guidString } : {}),
            name: PersonName.flatten(person.name),
            fineIds: person.fineIds.map(fineId => fineId.guidString),
            signInData: SignInData.flatten(person.signInData),
            invitationLinkId: person.invitationLinkId ?? null
        };
    }

    export function concrete(person: Person.Flatten): Person;
    export function concrete(person: Omit<Person.Flatten, 'id'>): Omit<Person, 'id'>;
    export function concrete(person: Person.Flatten | Omit<Person.Flatten, 'id'>): Person | Omit<Person, 'id'> {
        return {
            ...('id' in person ? { id: new Guid(person.id) } : {}),
            name: PersonName.concrete(person.name),
            fineIds: person.fineIds.map(fineId => new Guid(fineId)),
            signInData: SignInData.concrete(person.signInData),
            invitationLinkId: person.invitationLinkId ?? undefined
        };
    }

    export type PersonalProperties = Omit<Person, 'fineIds' | 'signInData' | 'invitationLinkId'>;

    export namespace PersonalProperties {
        export function fromObjectWithId(value: object | null, logger: ILogger): PersonalProperties {
            logger.log('PersonalProperties.fromObject', { value: value });
    
            if (value === null)
                throw HttpsError('internal', 'Couldn\'t get personal properites from null.', logger);
    
            if (!('id' in value) || typeof value.id !== 'string')
                throw HttpsError('internal', 'Couldn\'t get id for personal properites.', logger);
    
            return { 
                ... PersonalProperties.fromObject(value, logger.nextIndent),
                id: Guid.fromString(value.id, logger.nextIndent),
            };
        }

        export function fromObject(value: object | null, logger: ILogger): Omit<Person.PersonalProperties, 'id'> {
            logger.log('Person.PersonalProperties.fromObject', { value: value });

            if (value === null)
                throw HttpsError('internal', 'Couldn\'t get person personal properites from null.', logger);

            if (!('name' in value) || typeof value.name !== 'object')
                throw HttpsError('internal', 'Couldn\'t get name for person personal properites.', logger);

            return {
                name: PersonName.fromObject(value.name, logger.nextIndent)
            };
        }

        export type Flatten = Omit<Person.Flatten, 'fineIds' | 'signInData' | 'invitationLinkId'>;

        export function flatten(person: Person.PersonalProperties): Person.PersonalProperties.Flatten;
        export function flatten(person: Omit<Person.PersonalProperties, 'id'>): Omit<Person.PersonalProperties.Flatten, 'id'>;
        export function flatten(person: Person.PersonalProperties | Omit<Person.PersonalProperties, 'id'>): Person.PersonalProperties.Flatten | Omit<Person.PersonalProperties.Flatten, 'id'> {
            return {
                ...('id' in person ? { id: person.id.guidString } : {}),
                name: PersonName.flatten(person.name)
            };
        }

        export function concrete(person: Person.PersonalProperties.Flatten): Person.PersonalProperties;
        export function concrete(person: Omit<Person.PersonalProperties.Flatten, 'id'>): Omit<Person.PersonalProperties, 'id'>;
        export function concrete(person: Person.PersonalProperties.Flatten | Omit<Person.PersonalProperties.Flatten, 'id'>): Person.PersonalProperties | Omit<Person.PersonalProperties, 'id'> {
            return {
                ...('id' in person ? { id: new Guid(person.id) } : {}),
                name: PersonName.concrete(person.name)
            };
        }
    }
}
