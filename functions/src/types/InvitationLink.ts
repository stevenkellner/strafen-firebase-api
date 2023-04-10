import { Crypter, DatabaseReference, type DatabaseType } from 'firebase-function';
import { type Guid } from './Guid';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';

export class InvitationLink {
    public constructor(
        private readonly clubId: Guid,
        private readonly personId: Guid,
        private readonly databaseType: DatabaseType
    ) {}

    public async createId(): Promise<string> {
        let version = 0;
        while (true) {
            const id = this.createVersionisedId(version);
            if ((await this.checkId(id)) !== 'notMyId')
                return id;
            version += 1;
        }
    }

    public async getId(): Promise<string | null> {
        let version = 0;
        while (true) {
            const id = this.createVersionisedId(version);
            const result = await this.checkId(id);
            if (result === 'notExists')
                return null;
            if (result === 'myId')
                return id;
            version += 1;
        }
    }

    private createVersionisedId(version: number): string {
        const rawValue = JSON.stringify({
            clubId: this.clubId.guidString,
            personId: this.personId.guidString,
            version: version
        });
        const hashValue = Crypter.sha512(rawValue);
        return hashValue.slice(0, 16);
    }

    private async checkId(id: string): Promise<'myId' | 'notMyId' | 'notExists'> {
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.databaseType)).child('invitationLinks').child(id);
        const snapshot = await reference.snapshot();
        if (!snapshot.exists)
            return 'notExists';
        const value = snapshot.value('decrypt');
        const isMyId = value.clubId === this.clubId.guidString && value.personId === this.personId.guidString;
        return isMyId ? 'myId' : 'notMyId';
    }
}
