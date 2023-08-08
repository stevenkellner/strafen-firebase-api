import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { getPrivateKeys } from '../privateKeys';
import { Guid } from '../types/Guid';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { Deletable, baseDatabase } from '../utils';
import { Fine } from '../types/Fine';

export class FineGetChangesFunction implements FirebaseFunction<FineGetChangesFunctionType> {
    public readonly parameters: FunctionType.Parameters<FineGetChangesFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('FineGetChangesFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<FineGetChangesFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<FineGetChangesFunctionType>> {
        this.logger.log('FineGetChangesFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubMember', this.parameters.databaseType, this.logger.nextIndent);
        const reference = baseDatabase(this).child('clubs').child(this.parameters.clubId.guidString).child('changes').child('fines');
        const snapshot = await reference.snapshot();
        return await Promise.all(snapshot.compactMap<Promise<Deletable<Fine.Flatten>>>(snapshot => {
            if (snapshot.key === null)
                return null;
            return this.getFine(snapshot.key);
        }));
    }

    private async getFine(id: string): Promise<Deletable<Fine.Flatten>> {
        const reference = baseDatabase(this).child('clubs').child(this.parameters.clubId.guidString).child('fines').child(id);
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

export type FineGetChangesFunctionType = FunctionType<{
    clubId: Guid;
}, Deletable<Fine.Flatten>[], {
    clubId: string;
}>;
