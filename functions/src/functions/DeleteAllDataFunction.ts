import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterContainer, ParameterParser, type FunctionType, HttpsError, DatabaseReference } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';

export class DeleteAllDataFunction implements FirebaseFunction<DeleteAllDataFunctionType> {
    public readonly parameters: FunctionType.Parameters<DeleteAllDataFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('DeleteAllDataFunction.constructor', { auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<DeleteAllDataFunctionType>>({}, this.logger.nextIndent);
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<DeleteAllDataFunctionType>> {
        this.logger.log('DeleteAllDataFunction.executeFunction', {}, 'info');
        if (this.parameters.databaseType.value !== 'testing')
            throw HttpsError('failed-precondition', 'Function can only be called for testing.', this.logger);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType));
        await reference.remove();
    }
}

export type DeleteAllDataFunctionType = FunctionType<Record<string, never>, void>;
