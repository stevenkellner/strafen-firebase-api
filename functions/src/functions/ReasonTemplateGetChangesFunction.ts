import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { getPrivateKeys } from '../privateKeys';
import { Guid } from '../types/Guid';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { Deletable, baseDatabase } from '../utils';
import { ReasonTemplate } from '../types/ReasonTemplate';

export class ReasonTemplateGetChangesFunction implements FirebaseFunction<ReasonTemplateGetChangesFunctionType> {
    public readonly parameters: FunctionType.Parameters<ReasonTemplateGetChangesFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('ReasonTemplateGetChangesFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<ReasonTemplateGetChangesFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<ReasonTemplateGetChangesFunctionType>> {
        this.logger.log('ReasonTemplateGetChangesFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubMember', this.parameters.databaseType, this.logger.nextIndent);
        const reference = baseDatabase(this).child('clubs').child(this.parameters.clubId.guidString).child('changes').child('reasonTemplates');
        const snapshot = await reference.snapshot();
        return await Promise.all(snapshot.compactMap<Promise<Deletable<ReasonTemplate.Flatten>>>(snapshot => {
            if (snapshot.key === null)
                return null;
            return this.getReasonTemplate(snapshot.key);
        }));
    }

    private async getReasonTemplate(id: string): Promise<Deletable<ReasonTemplate.Flatten>> {
        const reference = baseDatabase(this).child('clubs').child(this.parameters.clubId.guidString).child('reasonTemplates').child(id);
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

export type ReasonTemplateGetChangesFunctionType = FunctionType<{
    clubId: Guid;
}, Deletable<ReasonTemplate.Flatten>[], {
    clubId: string;
}>;
