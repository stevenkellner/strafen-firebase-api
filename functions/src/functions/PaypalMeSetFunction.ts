import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { getPrivateKeys } from '../privateKeys';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { Guid } from '../types/Guid';
import { DatabaseScheme } from '../DatabaseScheme';

export class PaypalMeSetFunction implements FirebaseFunction<PaypalMeSetFunctionType> {
    public readonly parameters: FunctionType.Parameters<PaypalMeSetFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('PaypalMeSetFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<PaypalMeSetFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                paypalMeLink: ParameterBuilder.optional(ParameterBuilder.value('string'))
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<PaypalMeSetFunctionType>> {
        this.logger.log('PaypalMeSetFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubMember', this.parameters.databaseType, this.logger.nextIndent);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('paypalMeLink');
        await reference.set(this.parameters.paypalMeLink ?? null, 'encrypt');
    }
}

export type PaypalMeSetFunctionType = FunctionType<{
    clubId: Guid;
    paypalMeLink: string | undefined;
}, void, {
    clubId: string;
    paypalMeLink: string | null;
}>;
