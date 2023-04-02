import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference, HttpsError } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { EditType } from '../types/EditType';
import { Guid } from '../types/Guid';
import { ReasonTemplate } from '../types/ReasonTemplate';

export class ReasonTemplateEditFunction implements FirebaseFunction<ReasonTemplateEditFunctionType> {
    public readonly parameters: FunctionType.Parameters<ReasonTemplateEditFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('ReasonTemplateEditFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<ReasonTemplateEditFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                editType: ParameterBuilder.guard('string', EditType.typeGuard),
                reasonTemplateId: ParameterBuilder.build('string', Guid.fromString),
                reasonTemplate: ParameterBuilder.optional(ParameterBuilder.build('object', ReasonTemplate.fromObject))
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<ReasonTemplateEditFunctionType>> {
        this.logger.log('ReasonTemplateEditFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubManager', this.parameters.databaseType, this.logger.nextIndent);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('reasonTemplates').child(this.parameters.reasonTemplateId.guidString);
        const snapshot = await reference.snapshot();
        if (this.parameters.editType === 'delete') {
            if (snapshot.exists)
                await reference.remove();
        } else {
            if (this.parameters.reasonTemplate === undefined)
                throw HttpsError('invalid-argument', 'No reason template in parameters to add / update.', this.logger);
            if (this.parameters.editType === 'add' && snapshot.exists)
                throw HttpsError('invalid-argument', 'Couldn\'t add existing reason template.', this.logger);
            if (this.parameters.editType === 'update' && !snapshot.exists)
                throw HttpsError('invalid-argument', 'Couldn\'t update not existing reason template.', this.logger);
            await reference.set(ReasonTemplate.flatten(this.parameters.reasonTemplate), 'encrypt');
        }
    }
}

export type ReasonTemplateEditFunctionType = FunctionType<{
    clubId: Guid;
    editType: EditType;
    reasonTemplateId: Guid;
    reasonTemplate: Omit<ReasonTemplate, 'id'> | undefined;
}, void>;
