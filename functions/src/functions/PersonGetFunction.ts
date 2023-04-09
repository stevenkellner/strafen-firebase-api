import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { Guid } from '../types/Guid';
import { type Person } from '../types/Person';

export class PersonGetFunction implements FirebaseFunction<PersonGetFunctionType> {
    public readonly parameters: FunctionType.Parameters<PersonGetFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('PersonGetFunction.constructor', { auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<PersonGetFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<PersonGetFunctionType>> {
        this.logger.log('PersonGetFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubMember', this.parameters.databaseType, this.logger.nextIndent);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('persons');
        const snapshot = await reference.snapshot();
        return snapshot.reduce<Record<string, Person.Flatten>>({}, (value, snapshot) => {
            if (snapshot.key === null)
                return value;
            return {
                ...value,
                [snapshot.key]: {
                    id: snapshot.key,
                    ...snapshot.value('decrypt')
                }
            };
        });
    }
}

export type PersonGetFunctionType = FunctionType<{
    clubId: Guid;
}, Record<string, Person.Flatten>, {
    clubId: string;
}>;
