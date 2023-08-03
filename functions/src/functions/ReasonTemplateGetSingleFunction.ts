import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { getPrivateKeys } from '../privateKeys';
import { ReasonTemplate } from '../types/ReasonTemplate';
import { Guid } from '../types/Guid';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { baseDatabase } from '../utils';

export class ReasonTemplateGetSingleFunction implements FirebaseFunction<ReasonTemplateGetSingleFunctionType> {
    public readonly parameters: FunctionType.Parameters<ReasonTemplateGetSingleFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('ReasonTemplateGetSingleFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<ReasonTemplateGetSingleFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                reasonTemplateId: ParameterBuilder.build('string', Guid.fromString),
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<ReasonTemplateGetSingleFunctionType>> {
        this.logger.log('ReasonTemplateGetSingleFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubMember', this.parameters.databaseType, this.logger.nextIndent);
        const reference = baseDatabase(this).child('clubs').child(this.parameters.clubId.guidString).child('reasonTemplates').child(this.parameters.reasonTemplateId.guidString);
        const snapshot = await reference.snapshot();
        if (!snapshot.exists || snapshot.key === null)
            return null;
        return {
            id: snapshot.key,
            ...snapshot.value('decrypt')
        };
    }
}

export type ReasonTemplateGetSingleFunctionType = FunctionType<{
    clubId: Guid;
    reasonTemplateId: Guid;
}, ReasonTemplate.Flatten | null, {
    clubId: string;
    reasonTemplateId: string;
}>;
