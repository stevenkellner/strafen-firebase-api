import * as admin from 'firebase-admin';
import { DatabaseType, ILogger } from "firebase-function";
import { Fine } from "./types/Fine";
import { Guid } from "./types/Guid";
import { Person } from "./types/Person";
import { PersonName } from "./types/PersonName";
import { ReasonTemplate } from "./types/ReasonTemplate";
import { baseDatabase } from "./utils";

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

export class CreatorNotifier {
    public constructor(
        private readonly clubId: Guid, 
        private readonly hashedUserId: string,
        private readonly databaseType: DatabaseType,
        private readonly logger: ILogger
    ) {}

    public async notify(type: CreatorNotificationType) {
        this.logger.log('CreatorNotifier.notify', { type: type, clubId: this.clubId, hashedUserId: this.hashedUserId });
        const [ creator, signedInUser ] = await Promise.all([
            this.getCreator(),
            this.getSignedInUser()
        ]);
        if (creator === null || signedInUser === null)
            return;
        const notification = await this.notification(type, signedInUser);
        if (notification === null)
            return;
        const responses = await admin.messaging().sendEach(Object.values(creator.notificationTokens).map(token => {
            return {
                token: token,
                notification: notification,
                data: {
                    clubId: this.clubId.guidString,
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
                this.logger.log('CreatorNotifier.notify failed', { error: response.error });
            } else if (response.success) {
                this.logger.log('CreatorNotifier.notify succeeded');
            }
        }
    }
    
    private async getCreator(): Promise<{ id: Guid; notificationTokens: Record<string, string> } | null> {
        const reference = baseDatabase(this.databaseType).child('clubs').child(this.clubId.guidString).child('creator');
        const snapshot = await reference.snapshot();
        if (!snapshot.exists)
            return null;
        const creator = snapshot.value();
        if (creator === undefined || creator === null)
            return null;
        const personReference = baseDatabase(this.databaseType).child('clubs').child(this.clubId.guidString).child('persons').child(creator.id);
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
    
    private async getSignedInUser(): Promise<{ name: PersonName } | null> {
        const userReference = baseDatabase(this.databaseType).child('users').child(this.hashedUserId);
        const userSnapshot = await userReference.snapshot();
        if (!userSnapshot.exists)
            return null;
        const user = userSnapshot.value('decrypt');
        const personReference = baseDatabase(this.databaseType).child('clubs').child(user.clubId).child('persons').child(user.personId);
        const personSnapshot = await personReference.snapshot();
        if (!personSnapshot.exists)
            return null;
        const person = personSnapshot.value('decrypt');
        return { name: PersonName.concrete(person.name) };
    }

    private async notification(type: CreatorNotificationType, signedInUser: { name: PersonName }): Promise<{ title: string; body: string } | null> {
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
                const person = await this.getPerson(type.fine);
                if (person === null)
                    return null;
                return {
                    title: `${signedInPersonName} hat eine Strafe hinzugefügt`,
                    body: `${Fine.description(type.fine, person)} wurde hinzugefügt`
                };
            }
            case 'fine-update': {
                const person = await this.getPerson(type.fine);
                if (person === null)
                    return null;
                return {
                    title: `${signedInPersonName} hat eine Strafe bearbeitet`,
                    body: `${Fine.description(type.fine, person)} wurde bearbeitet`
                };
            }
            case 'fine-delete': {
                const person = await this.getPerson(type.fine);
                if (person === null)
                    return null;
                return {
                    title: `${signedInPersonName} hat eine Strafe gelöscht`,
                    body: `${Fine.description(type.fine, person)} wurde gelöscht`
                };
            }
            case 'fine-edit-payed': {
                const person = await this.getPerson(type.fine);
                if (person === null)
                    return null;
                return {
                    title: `${signedInPersonName} hat eine Strafe geändert`,
                    body: `${Fine.description(type.fine, person)} wurde ${type.fine.payedState === 'payed' ? 'gezahlt' : 'nicht gezahlt'}`
                };
            }
        }
    }
    
    private async getPerson(fine: Omit<Fine, 'id'>): Promise<Omit<Person, 'id'> | null> {
        const reference = baseDatabase(this.databaseType).child('clubs').child(this.clubId.guidString).child('persons').child((fine).personId.guidString);
        const snapshot = await reference.snapshot();
        if (!snapshot.exists)
            return null;
        return Person.concrete(snapshot.value('decrypt'));
    }
}
