import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference, HttpsError } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { Guid } from '../types/Guid';
import { InvitationLink } from '../types/InvitationLink';
import { Person } from '../types/Person';
import { CreatorNotifier } from '../CreatorNotifier';

export class PersonDeleteFunction implements FirebaseFunction<PersonDeleteFunctionType> {
    public readonly parameters: FunctionType.Parameters<PersonDeleteFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('PersonDeleteFunction.constructor', { auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<PersonDeleteFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                personId: ParameterBuilder.build('string', Guid.fromString)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<PersonDeleteFunctionType>> {
        this.logger.log('PersonDeleteFunction.executeFunction', {}, 'info');
        const hashedUserId = await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubManager', this.parameters.databaseType, this.logger.nextIndent);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('persons').child(this.parameters.personId.guidString);
        const snapshot = await reference.snapshot();
        if (!snapshot.exists)
            return;
        const person = snapshot.value('decrypt');
        if (person.signInData !== null)
            throw HttpsError('unavailable', 'Cannot delete registered person.', this.logger);
        await Promise.all(person.fineIds.map(async fineId => {
            const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('fines').child(fineId);
            const snapshot = await reference.snapshot();
            if (snapshot.exists)
                await reference.remove();
        }));
        await reference.remove();
        const invitationLink = new InvitationLink(this.parameters.clubId, this.parameters.personId, this.parameters.databaseType);
        const invitationLinkId = await invitationLink.getId();
        if (invitationLinkId !== null) {
            const invitationLinkReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('invitationLinks').child(invitationLinkId);
            const invitationLinkSnapshot = await invitationLinkReference.snapshot();
            if (invitationLinkSnapshot.exists)
                await invitationLinkReference.remove();
        }
        const creatorNotifier = new CreatorNotifier(this.parameters.clubId, hashedUserId, this.parameters.databaseType, this.logger.nextIndent);        
        await creatorNotifier.notify({ state: 'person-delete', person: Person.concrete(person) });
    }
}

export type PersonDeleteFunctionType = FunctionType<{
    clubId: Guid;
    personId: Guid;
}, void, {
    clubId: string;
    personId: string;
}>;
