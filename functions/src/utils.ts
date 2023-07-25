import * as admin from 'firebase-admin';
import { DatabaseReference, DatabaseType, ILogger } from "firebase-function";
import { Guid } from "./types/Guid";
import { DatabaseScheme } from "./DatabaseScheme";
import { getPrivateKeys } from "./privateKeys";
import { PersonName } from './types/PersonName';
import { Person } from './types/Person';
import { ReasonTemplate } from './types/ReasonTemplate';
import { Fine } from './types/Fine';

export function removeKey<T extends Record<string, unknown>, Key extends keyof T>(value: T, key: Key): Omit<T, Key> {
    const newValue = {} as Omit<T, Key>;
    for (const entry of Object.entries(value)) {
        if (entry[0] !== key)
            newValue[entry[0] as keyof Omit<T, Key>] = entry[1] as Omit<T, Key>[keyof Omit<T, Key>];
    }
    return newValue;
}

export type CreatorNotificationType = {
    state: 'person-add';
    person: Omit<Person.PersonalProperties, 'id'>;
} | {
    state: 'person-update';
    person: Omit<Person.PersonalProperties, 'id'>;
} | {
    state: 'person-delete';
    person: Omit<Person, 'id'>;
} | {
    state: 'reason-template-add';
    reasonTemplate: Omit<ReasonTemplate, 'id'>;
} | {
    state: 'reason-template-update';
    reasonTemplate: Omit<ReasonTemplate, 'id'>;
} | {
    state: 'reason-template-delete';
    reasonTemplate: Omit<ReasonTemplate, 'id'>;
} | {
    state: 'fine-add';
    fine: Omit<Fine, 'id'>;
} | {
    state: 'fine-update';
    fine: Omit<Fine, 'id'>;
} | {
    state: 'fine-delete';
    fine: Omit<Fine, 'id'>;
} | {
    state: 'fine-edit-payed';
    fine: Omit<Fine, 'id'>;
};

export namespace CreatorNotificationType {
    export async function notification(type: CreatorNotificationType, signedInUser: { name: PersonName }, clubId: Guid, databaseType: DatabaseType): Promise<{ title: string; body: string } | null> {
        const signedInPersonName = PersonName.description(signedInUser.name);
        switch (type.state) {
            case 'person-add':
                return {
                    title: `${signedInPersonName} hat eine neue Person hinzugefügt`,
                    body: `${PersonName.description(type.person.name)} wurde hinzugefügt`
                };
            case 'person-update':
                return {
                    title: `${signedInPersonName} hat eine Person bearbeitet`,
                    body: `${PersonName.description(type.person.name)} wurde bearbeitet`
                };
            case 'person-delete':
                return {
                    title: `${signedInPersonName} hat eine Person gelöscht`,
                    body: `${PersonName.description(type.person.name)} wurde gelöscht`
                };
            case 'reason-template-add':
                return {
                    title: `${signedInPersonName} hat eine Strafe zum Strafenkatalog hinzugefügt`,
                    body: `${ReasonTemplate.description(type.reasonTemplate)} wurde hinzugefügt`
                };
            case 'reason-template-update':
                return {
                    title: `${signedInPersonName} hat eine Strafe aus dem Strafenkatalog bearbeitet`,
                    body: `${ReasonTemplate.description(type.reasonTemplate)} wurde bearbeitet`
                };
            case 'reason-template-delete':
                return {
                    title: `${signedInPersonName} hat eine Strafen aus dem Strafenkatalog gelöscht`,
                    body: `${ReasonTemplate.description(type.reasonTemplate)} wurde gelöscht`
                };
            case 'fine-add': {
                const person = await getPerson(type.fine, clubId, databaseType);
                if (person === null)
                    return null;
                return {
                    title: `${signedInPersonName} hat eine Strafe hinzugefügt`,
                    body: `${Fine.description(type.fine, person)} wurde hinzugefügt`
                };
            }
            case 'fine-update': {
                const person = await getPerson(type.fine, clubId, databaseType);
                if (person === null)
                    return null;
                return {
                    title: `${signedInPersonName} hat eine Strafe bearbeitet`,
                    body: `${Fine.description(type.fine, person)} wurde bearbeitet`
                };
            }
            case 'fine-delete': {
                const person = await getPerson(type.fine, clubId, databaseType);
                if (person === null)
                    return null;
                return {
                    title: `${signedInPersonName} hat eine Strafe gelöscht`,
                    body: `${Fine.description(type.fine, person)} wurde gelöscht`
                };
            }
            case 'fine-edit-payed': {
                const person = await getPerson(type.fine, clubId, databaseType);
                if (person === null)
                    return null;
                return {
                    title: `${signedInPersonName} hat eine Strafe geändert`,
                    body: `${Fine.description(type.fine, person)} wurde ${type.fine.payedState === 'payed' ? 'gezahlt' : 'nicht gezahlt'}`
                };
            }
        }
    }
}

export async function notifyCreator(type: CreatorNotificationType, clubId: Guid, hashedUserId: string, databaseType: DatabaseType, logger: ILogger) {
    logger.log('notifyCreator', { type: type, clubId: clubId, hashedUserId: hashedUserId });
    const [ creator, signedInUser ] = await Promise.all([
        getCreator(clubId, databaseType),
        getSignedInUser(hashedUserId, databaseType)
    ]);
    if (creator === null || signedInUser === null)
        return;
    const notification = await CreatorNotificationType.notification(type, signedInUser, clubId, databaseType);
    if (notification === null)
        return;
    const responses = await admin.messaging().sendEach(Object.values(creator.notificationTokens).map(token => {
        return {
            token: token,
            notification: notification,
            data: {
                clubId: clubId.guidString,
                personId: creator.id.guidString
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        mutableContent: true
                    }
                }
            }
        };
    }));
    for (const response of responses.responses) {
        if (response.error) {
            logger.log('notifyCreator failed', { error: response.error });
        } else if (response.success) {
            logger.log('notifyCreator succeeded');
        }
    }
}

export async function getCreator(clubId: Guid, databaseType: DatabaseType): Promise<{ id: Guid; notificationTokens: Record<string, string> } | null> {
    const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(databaseType)).child('clubs').child(clubId.guidString).child('creator');
    const snapshot = await reference.snapshot();
    if (!snapshot.exists)
        return null;
    const creator = snapshot.value();
    if (creator === undefined || creator === null)
        return null;
    const personReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(databaseType)).child('clubs').child(clubId.guidString).child('persons').child(creator.id);
    const personSnapshot = await personReference.snapshot();
    if (!personSnapshot.exists)
        return null;
    const person = personSnapshot.value('decrypt');
    if (person.signInData === undefined || person.signInData === null)
        return null;
    return {
        id: new Guid(creator.id),
        notificationTokens: person.signInData.notificationTokens
    };
}

export async function getSignedInUser(hashedUserId: string, databaseType: DatabaseType): Promise<{ name: PersonName } | null> {
    const userReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(databaseType)).child('users').child(hashedUserId);
    const userSnapshot = await userReference.snapshot();
    if (!userSnapshot.exists)
        return null;
    const user = userSnapshot.value('decrypt');
    const personReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(databaseType)).child('clubs').child(user.clubId).child('persons').child(user.personId);
    const personSnapshot = await personReference.snapshot();
    if (!personSnapshot.exists)
        return null;
    const person = personSnapshot.value('decrypt');
    return { name: PersonName.concrete(person.name) };
}

export async function getPerson(fine: Omit<Fine, 'id'>, clubId: Guid, databaseType: DatabaseType): Promise<Omit<Person, 'id'> | null> {
    const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(databaseType)).child('clubs').child(clubId.guidString).child('persons').child((fine).personId.guidString);
    const snapshot = await reference.snapshot();
    if (!snapshot.exists)
        return null;
    return Person.concrete(snapshot.value('decrypt'));
}