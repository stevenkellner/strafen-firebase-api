import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference, HttpsError } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { getPrivateKeys } from '../privateKeys';
import { Guid } from '../types/Guid';
import { type DatabaseScheme } from '../DatabaseScheme';
import { InvitationLink } from '../types/InvitationLink';
import { checkUserAuthentication } from '../checkUserAuthentication';

export class InvitationLinkCreateIdFunction implements FirebaseFunction<InvitationLinkCreateIdFunctionType> {
    public readonly parameters: FunctionType.Parameters<InvitationLinkCreateIdFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('InvitationLinkCreateIdFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<InvitationLinkCreateIdFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                personId: ParameterBuilder.build('string', Guid.fromString)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<InvitationLinkCreateIdFunctionType>> {
        this.logger.log('InvitationLinkCreateIdFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubManager', this.parameters.databaseType, this.logger.nextIndent);
        const personReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('persons').child(this.parameters.personId.guidString);
        const personSnapshot = await personReference.snapshot();
        if (!personSnapshot.exists)
            throw HttpsError('not-found', 'Couldn\'t invite not existing person.', this.logger);
        const person = personSnapshot.value('decrypt');
        if (person.signInData !== null)
            throw HttpsError('unavailable', 'Couldn\'t invite registered person.', this.logger);
        const invitationLink = new InvitationLink(this.parameters.clubId, this.parameters.personId, this.parameters.databaseType);
        const id = await invitationLink.createId();
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('invitationLinks').child(id);
        await reference.set({
            clubId: this.parameters.clubId.guidString,
            personId: this.parameters.personId.guidString
        }, 'encrypt');
        await personReference.set({
            ...person,
            invitationLinkId: id
        }, 'encrypt');
        return id;
    }
}

export type InvitationLinkCreateIdFunctionType = FunctionType<{
    clubId: Guid;
    personId: Guid;
}, string, {
    clubId: string;
    personId: string;
}>;
