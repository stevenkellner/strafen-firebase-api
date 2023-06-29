import * as admin from 'firebase-admin';
import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference, HttpsError } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { getPrivateKeys } from '../privateKeys';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { Guid } from '../types/Guid';
import { NotificationPayload } from '../types/NotificationPayload';
import { type DatabaseScheme } from '../DatabaseScheme';

export class NotificationPushFunction implements FirebaseFunction<NotificationPushFunctionType> {
    public readonly parameters: FunctionType.Parameters<NotificationPushFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('NotificationPushFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<NotificationPushFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                personId: ParameterBuilder.build('string', Guid.fromString),
                payload: ParameterBuilder.build('object', NotificationPayload.fromObject)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<NotificationPushFunctionType>> {
        this.logger.log('NotificationPushFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubManager', this.parameters.databaseType, this.logger.nextIndent);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('persons').child(this.parameters.personId.guidString);
        const snapshot = await reference.snapshot();
        if (!snapshot.exists)
            throw HttpsError('not-found', 'Person doesn\'t exist.', this.logger);
        const person = snapshot.value('decrypt');
        if (person.signInData === null)
            throw HttpsError('unavailable', 'Person is not signed in.', this.logger);
        const tokens = Object.entries(person.signInData.notificationTokens);
        if (tokens.length === 0)
            return;
        const response = await admin.messaging().sendToDevice(tokens.map(entry => entry[1]), {
            notification: {
                badge: '1',
                sound: 'default',
                title: decodeURIComponent(escape(this.parameters.payload.title)),
                body: decodeURIComponent(escape(this.parameters.payload.body))
            },
            data: {
                clubId: this.parameters.clubId.guidString,
                personId: this.parameters.personId.guidString
            }
        }, {
            mutableContent: true
        });
        for (let index = 0; index < tokens.length; index++) {
            const result = response.results[index];
            if (result.error === undefined)
                continue;
            if (result.error.code !== 'messaging/invalid-registration-token' && result.error.code !== 'messaging/registration-token-not-registered')
                continue;
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete person.signInData.notificationTokens[tokens[index][0]];
        }
        await reference.set(person, 'encrypt');
    }
}

export type NotificationPushFunctionType = FunctionType<{
    clubId: Guid;
    personId: Guid;
    payload: NotificationPayload;
}, void, {
    clubId: string;
    personId: string;
    payload: NotificationPayload;
}>;
