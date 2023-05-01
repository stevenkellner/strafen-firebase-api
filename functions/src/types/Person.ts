import { HttpsError, type ILogger } from 'firebase-function';
import { Guid } from './Guid';
import { PersonName } from './PersonName';
import { SignInData } from './SignInData';

export type Person = {
    id: Guid;
    name: PersonName;
    fineIds: Guid[];
    signInData?: SignInData;
    isInvited: boolean;
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

        if (!('signInData' in value) || typeof value.signInData !== 'object')
            throw HttpsError('internal', 'Couldn\'t get sign in data for person.', logger);

        if (!('isInvited' in value) || typeof value.isInvited !== 'boolean')
            throw HttpsError('internal', 'Couldn\'t get isInvited for person.', logger);

        return {
            name: PersonName.fromObject(value.name, logger.nextIndent),
            fineIds: fineIds,
            signInData: SignInData.fromObject(value.signInData, logger.nextIndent),
            isInvited: value.isInvited
        };
    }

    export type Flatten = {
        id: string;
        name: PersonName.Flatten;
        fineIds: string[];
        signInData: SignInData.Flatten | null;
        isInvited: boolean;
    };

    export function flatten(person: Person): Person.Flatten;
    export function flatten(person: Omit<Person, 'id'>): Omit<Person.Flatten, 'id'>;
    export function flatten(person: Person | Omit<Person, 'id'>): Person.Flatten | Omit<Person.Flatten, 'id'> {
        return {
            ...('id' in person ? { id: person.id.guidString } : {}),
            name: PersonName.flatten(person.name),
            fineIds: person.fineIds.map(fineId => fineId.guidString),
            signInData: SignInData.flatten(person.signInData),
            isInvited: person.isInvited
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
            isInvited: person.isInvited
        };
    }

    export type PersonalProperties = Omit<Person, 'fineIds' | 'signInData' | 'isInvited'>;

    export namespace PersonalProperties {
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

        export type Flatten = Omit<Person.Flatten, 'fineIds' | 'signInData' | 'isInvited'>;

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
