import { Crypter } from 'firebase-function';
import { type Guid } from '../src/types/Guid';
import { firebaseApp } from './firebaseApp';

export function mapValues<T, U>(object: Record<string, T>, transform: (entry: [string, T]) => U): Record<string, U> {
    const newObject: Record<string, U> = {};
    for (const entry of Object.entries(object))
        newObject[entry[0]] = transform(entry);
    return newObject;
}

export async function getInvitationLinkId(clubId: Guid, personId: Guid): Promise<string | null> {
    let version = 0;
    while (true) {
        const rawValue = JSON.stringify({
            clubId: clubId.guidString,
            personId: personId.guidString,
            version: version
        });
        const hashValue = Crypter.sha512(rawValue);
        const id = hashValue.slice(0, 16);
        if (!(await firebaseApp.database.child('invitationLinks').child(id).exists()))
            return null;
        const value = await firebaseApp.database.child('invitationLinks').child(id).get('decrypt');
        if (value.clubId === clubId.guidString && value.personId === personId.guidString)
            return id;
        version += 1;
    }
}
