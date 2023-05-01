import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, Crypter, DatabaseReference, HttpsError } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { getPrivateKeys } from '../privateKeys';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { Guid } from '../types/Guid';
import { type DatabaseScheme } from '../DatabaseScheme';

export class NotificationRegisterFunction implements FirebaseFunction<NotificationRegisterFunctionType> {
    public readonly parameters: FunctionType.Parameters<NotificationRegisterFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('NotificationRegisterFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<NotificationRegisterFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                personId: ParameterBuilder.build('string', Guid.fromString),
                token: ParameterBuilder.value('string')
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<NotificationRegisterFunctionType>> {
        this.logger.log('NotificationRegisterFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubMember', this.parameters.databaseType, this.logger.nextIndent);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('persons').child(this.parameters.personId.guidString);
        const snapshot = await reference.snapshot();
        if (!snapshot.exists)
            throw HttpsError('not-found', 'Person doesn\'t exist.', this.logger);
        const person = snapshot.value('decrypt');
        if (person.signInData === null)
            throw HttpsError('unavailable', 'Person is not signed in.', this.logger);
        const key = Crypter.sha512(this.parameters.token).slice(0, 16);
        person.signInData.notificationTokens[key] = this.parameters.token;
        await reference.set(person, 'encrypt');
    }
}

export type NotificationRegisterFunctionType = FunctionType<{
    clubId: Guid;
    personId: Guid;
    token: string;
}, void, {
    clubId: string;
    personId: string;
    token: string;
}>;
