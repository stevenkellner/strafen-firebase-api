import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference, HttpsError } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { Guid } from '../types/Guid';
import { ReasonTemplate } from '../types/ReasonTemplate';
import { notifyCreator, removeKey } from '../utils';

export class ReasonTemplateAddFunction implements FirebaseFunction<ReasonTemplateAddFunctionType> {
    public readonly parameters: FunctionType.Parameters<ReasonTemplateAddFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('ReasonTemplateAddFunction.constructor', { auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<ReasonTemplateAddFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                reasonTemplate: ParameterBuilder.build('object', ReasonTemplate.fromObjectWithId)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<ReasonTemplateAddFunctionType>> {
        this.logger.log('ReasonTemplateAddFunction.executeFunction', {}, 'info');
        const hashedUserId = await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubManager', this.parameters.databaseType, this.logger.nextIndent);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('reasonTemplates').child(this.parameters.reasonTemplate.id.guidString);
        const snapshot = await reference.snapshot();
        if (snapshot.exists)
            throw HttpsError('invalid-argument', 'Couldn\'t add existing reason template.', this.logger);
        await reference.set(ReasonTemplate.flatten(removeKey(this.parameters.reasonTemplate, 'id')), 'encrypt');

        await notifyCreator({ state: 'reason-template-add', reasonTemplate: this.parameters.reasonTemplate }, this.parameters.clubId, hashedUserId, this.parameters.databaseType, this.logger.nextIndent);
    }
}

export type ReasonTemplateAddFunctionType = FunctionType<{
    clubId: Guid;
    reasonTemplate: ReasonTemplate;
}, void, {
    clubId: string;
    reasonTemplate: ReasonTemplate.Flatten;
}>;
