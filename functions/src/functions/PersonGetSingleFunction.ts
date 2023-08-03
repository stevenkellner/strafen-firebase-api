import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { getPrivateKeys } from '../privateKeys';
import { Person } from '../types/Person';
import { Guid } from '../types/Guid';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { baseDatabase } from '../utils';

export class PersonGetSingleFunction implements FirebaseFunction<PersonGetSingleFunctionType> {
    public readonly parameters: FunctionType.Parameters<PersonGetSingleFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('PersonGetSingleFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<PersonGetSingleFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                personId: ParameterBuilder.build('string', Guid.fromString),
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<PersonGetSingleFunctionType>> {
        this.logger.log('PersonGetSingleFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubMember', this.parameters.databaseType, this.logger.nextIndent);
        const reference = baseDatabase(this).child('clubs').child(this.parameters.clubId.guidString).child('persons').child(this.parameters.personId.guidString);
        const snapshot = await reference.snapshot();
        if (!snapshot.exists || snapshot.key === null)
            return null;
        return {
            id: snapshot.key,
            ...snapshot.value('decrypt')
        };
    }
}

export type PersonGetSingleFunctionType = FunctionType<{
    clubId: Guid;
    personId: Guid;
}, Person.Flatten | null, {
    clubId: string;
    personId: string;
}>;
