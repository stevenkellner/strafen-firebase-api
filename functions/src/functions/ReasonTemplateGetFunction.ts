import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { Guid } from '../types/Guid';
import { type ReasonTemplate } from '../types/ReasonTemplate';

export class ReasonTemplateGetFunction implements FirebaseFunction<ReasonTemplateGetFunctionType> {
    public readonly parameters: FunctionType.Parameters<ReasonTemplateGetFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('ReasonTemplateGetFunction.constructor', { auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<ReasonTemplateGetFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<ReasonTemplateGetFunctionType>> {
        this.logger.log('ReasonTemplateGetFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubMember', this.parameters.databaseType, this.logger.nextIndent);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('reasonTemplates');
        const snapshot = await reference.snapshot();
        return snapshot.reduceInto<Record<string, ReasonTemplate.Flatten>>({}, (value, snapshot) => {
            if (snapshot.key === null)
                return;
            value[snapshot.key] = {
                id: snapshot.key,
                ...snapshot.value('decrypt')
            };
        });
    }
}

export type ReasonTemplateGetFunctionType = FunctionType<{
    clubId: Guid;
}, Record<string, ReasonTemplate.Flatten>, {
    clubId: string;
}>;
