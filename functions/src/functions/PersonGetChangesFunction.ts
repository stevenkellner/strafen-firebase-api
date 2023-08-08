import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { getPrivateKeys } from '../privateKeys';
import { Guid } from '../types/Guid';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { Deletable, baseDatabase } from '../utils';
import { Person } from '../types/Person';

export class PersonGetChangesFunction implements FirebaseFunction<PersonGetChangesFunctionType> {
    public readonly parameters: FunctionType.Parameters<PersonGetChangesFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('PersonGetChangesFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<PersonGetChangesFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<PersonGetChangesFunctionType>> {
        this.logger.log('PersonGetChangesFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubMember', this.parameters.databaseType, this.logger.nextIndent);
        const reference = baseDatabase(this).child('clubs').child(this.parameters.clubId.guidString).child('changes').child('persons');
        const snapshot = await reference.snapshot();
        return await Promise.all(snapshot.compactMap<Promise<Deletable<Person.Flatten>>>(snapshot => {
            if (snapshot.key === null)
                return null;
            return this.getPerson(snapshot.key);
        }));
    }

    private async getPerson(id: string): Promise<Deletable<Person.Flatten>> {
        const reference = baseDatabase(this).child('clubs').child(this.parameters.clubId.guidString).child('persons').child(id);
        const snapshot = await reference.snapshot();
        if (!snapshot.exists)
            return {
                deleted: id
            };
        return {
            id: id,
            ...snapshot.value('decrypt')
        };
    }
}

export type PersonGetChangesFunctionType = FunctionType<{
    clubId: Guid;
}, Deletable<Person.Flatten>[], {
    clubId: string;
}>;
