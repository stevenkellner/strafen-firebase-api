import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference, HttpsError } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { Guid } from '../types/Guid';
import { Person } from '../types/Person';
import { notifyCreator, removeKey } from '../utils';

export class PersonAddFunction implements FirebaseFunction<PersonAddFunctionType> {
    public readonly parameters: FunctionType.Parameters<PersonAddFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('PersonAddFunction.constructor', { auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<PersonAddFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                person: ParameterBuilder.build('object', Person.PersonalProperties.fromObjectWithId)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<PersonAddFunctionType>> {
        this.logger.log('PersonAddFunction.executeFunction', {}, 'info');
        const hashedUserId = await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubManager', this.parameters.databaseType, this.logger.nextIndent);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('persons').child(this.parameters.person.id.guidString);
        const snapshot = await reference.snapshot();
        if (snapshot.exists)
            throw HttpsError('invalid-argument', 'Couldn\'t add existing person.', this.logger);
        await reference.set({
            ...Person.PersonalProperties.flatten(removeKey(this.parameters.person, 'id')),
            fineIds: [],
            signInData: null,
            isInvited: false
        }, 'encrypt');

        await notifyCreator({ state: 'person-add', person: this.parameters.person }, this.parameters.clubId, hashedUserId, this.parameters.databaseType, this.logger.nextIndent);
    }
}

export type PersonAddFunctionType = FunctionType<{
    clubId: Guid;
    person: Person.PersonalProperties;
}, void, {
    clubId: string;
    person: Person.PersonalProperties.Flatten;
}>;
