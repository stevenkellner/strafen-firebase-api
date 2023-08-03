import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference, HttpsError } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { Guid } from '../types/Guid';
import { Person } from '../types/Person';
import { removeKey } from '../utils';
import { CreatorNotifier } from '../CreatorNotifier';

export class PersonUpdateFunction implements FirebaseFunction<PersonUpdateFunctionType> {
    public readonly parameters: FunctionType.Parameters<PersonUpdateFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('PersonUpdateFunction.constructor', { auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<PersonUpdateFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                person: ParameterBuilder.build('object', Person.PersonalProperties.fromObjectWithId)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<PersonUpdateFunctionType>> {
        this.logger.log('PersonUpdateFunction.executeFunction', {}, 'info');
        const hashedUserId = await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubManager', this.parameters.databaseType, this.logger.nextIndent);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('persons').child(this.parameters.person.id.guidString);
        const snapshot = await reference.snapshot();
        if (!snapshot.exists)
            throw HttpsError('invalid-argument', 'Couldn\'t update not existing person.', this.logger);
        const person = snapshot.value('decrypt');
        await reference.set({
            ...Person.PersonalProperties.flatten(removeKey(this.parameters.person, 'id')),
            fineIds: person.fineIds,
            signInData: person.signInData,
            isInvited: person.isInvited
        }, 'encrypt');
        const creatorNotifier = new CreatorNotifier(this.parameters.clubId, hashedUserId, this.parameters.databaseType, this.logger.nextIndent);        
        await creatorNotifier.notify({ state: 'person-update', person: this.parameters.person });
    }
}

export type PersonUpdateFunctionType = FunctionType<{
    clubId: Guid;
    person: Person.PersonalProperties;
}, void, {
    clubId: string;
    person: Person.PersonalProperties.Flatten;
}>;
