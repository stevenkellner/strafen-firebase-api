import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { getPrivateKeys } from '../privateKeys';
import { Guid } from '../types/Guid';
import { type DatabaseScheme } from '../DatabaseScheme';
import { InvitationLink } from '../types/InvitationLink';
import { checkUserAuthentication } from '../checkUserAuthentication';

export class InvitationLinkWithdrawFunction implements FirebaseFunction<InvitationLinkWithdrawFunctionType> {
    public readonly parameters: FunctionType.Parameters<InvitationLinkWithdrawFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('InvitationLinkWithdrawFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<InvitationLinkWithdrawFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                personId: ParameterBuilder.build('string', Guid.fromString)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<InvitationLinkWithdrawFunctionType>> {
        this.logger.log('InvitationLinkWithdrawFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubManager', this.parameters.databaseType, this.logger.nextIndent);
        const invitationLink = new InvitationLink(this.parameters.clubId, this.parameters.personId, this.parameters.databaseType);
        const id = await invitationLink.getId();
        if (id === null)
            return;
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('invitationLinks').child(id);
        await reference.remove();
    }
}

export type InvitationLinkWithdrawFunctionType = FunctionType<{
    clubId: Guid;
    personId: Guid;
}, void, {
    clubId: string;
    personId: string;
}>;
