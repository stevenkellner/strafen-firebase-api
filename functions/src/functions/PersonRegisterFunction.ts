import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference, HttpsError } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { type ClubProperties } from '../types/ClubProperties';
import { Guid } from '../types/Guid';
import { PersonName } from '../types/PersonName';

export class PersonRegisterFunction implements FirebaseFunction<PersonRegisterFunctionType> {
    public readonly parameters: FunctionType.Parameters<PersonRegisterFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('PersonRegisterFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<PersonRegisterFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                personId: ParameterBuilder.build('string', Guid.fromString),
                personName: ParameterBuilder.build('object', PersonName.fromObject)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<PersonRegisterFunctionType>> {
        this.logger.log('PersonRegisterFunction.executeFunction', {}, 'info');
        const hashedUserId = await checkUserAuthentication(this.auth, this.parameters.clubId, [], this.parameters.databaseType, this.logger.nextIndent);
        await this.checkPersonExists();
        await Promise.all(this.setProperties(hashedUserId));
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString);
        const snapshot = await reference.snapshot();
        return {
            id: this.parameters.clubId.guidString,
            name: snapshot.child('name').value(),
            identifier: snapshot.child('identifier').value(),
            regionCode: snapshot.child('regionCode').value(),
            inAppPaymentActive: snapshot.child('inAppPaymentActive').value()
        };
    }

    private async checkPersonExists() {
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('persons').child(this.parameters.personId.guidString);
        const snapshot = await reference.snapshot();
        if (snapshot.exists)
            throw HttpsError('already-exists', 'Person already exists.', this.logger);
    }

    private * setProperties(hashedUserId: string) {
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString);
        yield reference.child('authentication').child('clubMember').child(hashedUserId).set('authenticated');
        yield reference.child('persons').child(this.parameters.personId.guidString).set({
            name: PersonName.flatten(this.parameters.personName),
            fineIds: [],
            signInData: {
                hashedUserId: hashedUserId,
                signInDate: new Date().toISOString()
            }
        }, 'encrypt');
        yield new Promise(async () => {
            const userReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('users').child(hashedUserId);
            const userSnapshot = await userReference.snapshot();
            if (userSnapshot.exists)
                throw HttpsError('already-exists', 'User is already registered.', this.logger);
            await userReference.set({
                clubId: this.parameters.clubId.guidString,
                personId: this.parameters.personId.guidString
            });
        });
    }
}

export type PersonRegisterFunctionType = FunctionType<{
    clubId: Guid;
    personId: Guid;
    personName: PersonName;
}, ClubProperties.Flatten>;
