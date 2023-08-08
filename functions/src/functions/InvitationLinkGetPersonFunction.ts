import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference, HttpsError } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { getPrivateKeys } from '../privateKeys';
import { type ClubProperties } from '../types/ClubProperties';
import { type Person } from '../types/Person';
import { type DatabaseScheme } from '../DatabaseScheme';

export class InvitationLinkGetPersonFunction implements FirebaseFunction<InvitationLinkGetPersonFunctionType> {
    public readonly parameters: FunctionType.Parameters<InvitationLinkGetPersonFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('InvitationLinkGetPersonFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<InvitationLinkGetPersonFunctionType>>(
            {
                invitationLinkId: ParameterBuilder.value('string')
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<InvitationLinkGetPersonFunctionType>> {
        this.logger.log('InvitationLinkGetPersonFunction.executeFunction', {}, 'info');
        const invitationLinkReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('invitationLinks').child(this.parameters.invitationLinkId);
        const invitationLinkSnapshot = await invitationLinkReference.snapshot();
        if (!invitationLinkSnapshot.exists)
            throw HttpsError('not-found', 'Couldn\'t find invitation link id.', this.logger);
        const { clubId, personId } = invitationLinkSnapshot.value('decrypt');
        const clubReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(clubId);
        const personSnapshot = await clubReference.child('persons').child(personId).snapshot();
        const person = personSnapshot.value('decrypt');
        return {
            id: personId,
            name: person.name,
            fineIds: person.fineIds,
            club: {
                id: clubId,
                name: (await clubReference.child('name').snapshot()).value(),
                paypalMeLink: (await clubReference.child('paypalMeLink').snapshot()).value('decrypt')
            }
        };
    }
}

export type InvitationLinkGetPersonFunctionType = FunctionType<{
    invitationLinkId: string;
}, Omit<Person.Flatten, 'signInData' | 'invitationLinkId'> & {
    club: ClubProperties.Flatten;
}>;
