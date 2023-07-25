import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { Guid } from '../types/Guid';
import { notifyCreator } from '../utils';
import { ReasonTemplate } from '../types/ReasonTemplate';

export class ReasonTemplateDeleteFunction implements FirebaseFunction<ReasonTemplateDeleteFunctionType> {
    public readonly parameters: FunctionType.Parameters<ReasonTemplateDeleteFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('ReasonTemplateDeleteFunction.constructor', { auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<ReasonTemplateDeleteFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                reasonTemplateId: ParameterBuilder.build('string', Guid.fromString)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<ReasonTemplateDeleteFunctionType>> {
        this.logger.log('ReasonTemplateDeleteFunction.executeFunction', {}, 'info');
        const hashedUserId = await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubManager', this.parameters.databaseType, this.logger.nextIndent);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('reasonTemplates').child(this.parameters.reasonTemplateId.guidString);
        const snapshot = await reference.snapshot();
        if (!snapshot.exists)
            return;
        const reasonTemplate = snapshot.value('decrypt');
        await reference.remove();

        await notifyCreator({ state: 'reason-template-delete', reasonTemplate: ReasonTemplate.concrete(reasonTemplate) }, this.parameters.clubId, hashedUserId, this.parameters.databaseType, this.logger.nextIndent);
    }
}

export type ReasonTemplateDeleteFunctionType = FunctionType<{
    clubId: Guid;
    reasonTemplateId: Guid;
}, void, {
    clubId: string;
    reasonTemplateId: string;
}>;
