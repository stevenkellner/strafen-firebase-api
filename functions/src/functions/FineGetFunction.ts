import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { type Fine } from '../types/Fine';
import { Guid } from '../types/Guid';

export class FineGetFunction implements FirebaseFunction<FineGetFunctionType> {
    public readonly parameters: FunctionType.Parameters<FineGetFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('FineGetFunction.constructor', { auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<FineGetFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<FineGetFunctionType>> {
        this.logger.log('FineGetFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubMember', this.parameters.databaseType, this.logger.nextIndent);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('fines');
        const snapshot = await reference.snapshot();
        return snapshot.reduce<Record<string, Fine.Flatten>>({}, (value, snapshot) => {
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

export type FineGetFunctionType = FunctionType<{
    clubId: Guid;
}, Record<string, Fine.Flatten>, {
    clubId: string;
}>;
