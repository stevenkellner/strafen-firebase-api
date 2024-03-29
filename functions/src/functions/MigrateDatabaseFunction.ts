import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference, HttpsError, UtcDate } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { getPrivateKeys } from '../privateKeys';
import { DatabaseScheme } from '../DatabaseScheme';
import { valueChanged } from '../utils';
import { Guid } from '../types/Guid';

export class MigrateDatabaseFunction implements FirebaseFunction<MigrateDatabaseFunctionType> {
    public readonly parameters: FunctionType.Parameters<MigrateDatabaseFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('MigrateDatabaseFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<MigrateDatabaseFunctionType>>({}, this.logger.nextIndent);
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<MigrateDatabaseFunctionType>> {
        this.logger.log('MigrateDatabaseFunction.executeFunction', {}, 'info');
        const version = await this.getCurrentVersion();
        if (version.major < 1)
            await this.migrateToVersion_1_0_0();
        if (version.major < 1 || version.minor < 1)
            await this.migrateToVersion_1_1_0();
        if (version.major < 1 || version.minor < 1 || version.patch < 1)
            await this.migrateToVersion_1_1_1();
    }

    private async getCurrentVersion(): Promise<{ major: number; minor: number; patch: number }> {
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('version');
        const snapshot = await reference.snapshot();
        if (!snapshot.exists) 
            return { major: 0, minor: 0, patch: 0 };
        const regex = /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)$/g;
        const match = regex.exec(snapshot.value());
        if (match === null || match.groups === undefined)
            throw HttpsError('internal', 'Invalid regex.', this.logger);
        return {
            major: Number.parseInt(match.groups.major),
            minor: Number.parseInt(match.groups.minor),
            patch: Number.parseInt(match.groups.patch)
        };
    }

    private async setVersion(version: { major: number; minor: number; patch: number }) {
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('version');
        await reference.set(`${version.major}.${version.minor}.${version.patch}`);
    }

    private async migrateToVersion_1_0_0() {
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs');
        const snapshot = await reference.snapshot();
        await Promise.all(snapshot.map(async clubSnapshot => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            await reference.child(clubSnapshot.key!).child('paypalMeLink').set(null, 'encrypt');
        }));
        await this.setVersion({ major: 1, minor: 0, patch: 0 });
    }

    private async migrateToVersion_1_1_0() {
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs');
        const snapshot = await reference.snapshot();
        await Promise.all(snapshot.map(async clubSnapshot => {
            await Promise.all(clubSnapshot.child('persons').map(async personSnapshot => {
                const person = personSnapshot.value('decrypt');
                if (person.signInData !== null)
                    person.signInData.signInDate = UtcDate.fromIsoDate(person.signInData.signInDate).encoded;
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                await reference.child(clubSnapshot.key!).child('persons').child(personSnapshot.key!).set(person, 'encrypt');
            }));
            await Promise.all(clubSnapshot.child('fines').map(async fineSnapshot => {
                const fine = fineSnapshot.value('decrypt');
                fine.date = UtcDate.fromIsoDate(fine.date).encoded;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                await reference.child(clubSnapshot.key!).child('fines').child(fineSnapshot.key!).set(fine, 'encrypt');
            }));
        }));
        await this.setVersion({ major: 1, minor: 1, patch: 0 });
    }

    private async migrateToVersion_1_1_1() {
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs');
        const snapshot = await reference.snapshot();
        await Promise.all(snapshot.map(async clubSnapshot => {
            await Promise.all(clubSnapshot.child('persons').map(async personSnapshot => {
                const person = personSnapshot.value('decrypt');
                if ((person as unknown as { isInvited: boolean }).isInvited) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    await valueChanged(new Guid(personSnapshot.key!), new Guid(clubSnapshot.key!), this.parameters.databaseType, 'persons');
                }
                person.invitationLinkId = null;
                delete (person as unknown as { isInvited?: boolean }).isInvited;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                await reference.child(clubSnapshot.key!).child('persons').child(personSnapshot.key!).set(person, 'encrypt');
            }));
        }));
        await this.setVersion({ major: 1, minor: 1, patch: 1 });
    }
}

export type MigrateDatabaseFunctionType = FunctionType<Record<PropertyKey, never>, void>;
