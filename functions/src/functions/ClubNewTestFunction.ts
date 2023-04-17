import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, HttpsError, DatabaseReference } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { Guid } from '../types/Guid';
import { TestClubType } from '../types/TestClubType';
import { type UserAuthenticationType } from '../types/UserAuthentication';
import { InvitationLink } from '../types/InvitationLink';

export class ClubNewTestFunction implements FirebaseFunction<ClubNewTestFunctionType> {
    public readonly parameters: FunctionType.Parameters<ClubNewTestFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('ClubNewTestFunction.constructor', { auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<ClubNewTestFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                testClubType: ParameterBuilder.guard('string', TestClubType.typeGuard)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<ClubNewTestFunctionType>> {
        this.logger.log('ClubNewTestFunction.executeFunction', {}, 'info');
        if (this.parameters.databaseType.value !== 'testing')
            throw HttpsError('failed-precondition', 'Function can only be called for testing.', this.logger);
        const testClub = TestClubType.testClub(this.parameters.testClubType);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString);
        await reference.child('name').set(testClub.name);
        for (const authentication of Object.entries(testClub.authentication) as Array<[UserAuthenticationType, { [Key in string]: string }]>)
            for (const user of Object.values(authentication[1]))
                await reference.child('authentication').child(authentication[0]).child(user).set('authenticated');
        for (const person of Object.entries(testClub.persons)) {
            await reference.child('persons').child(person[0]).set(person[1], 'encrypt');
            const hashedUserId = person[1].signInData?.hashedUserId;
            if (hashedUserId !== undefined) {
                const userReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('users').child(hashedUserId);
                const userSnapshot = await userReference.snapshot();
                if (userSnapshot.exists)
                    throw HttpsError('already-exists', 'User is already registered.', this.logger);
                await userReference.set({
                    clubId: this.parameters.clubId.guidString,
                    personId: person[0]
                }, 'encrypt');
            }
            if (person[1].isInvited) {
                const invitationLink = new InvitationLink(this.parameters.clubId, new Guid(person[0]), this.parameters.databaseType);
                const invitationLinkId = await invitationLink.createId();
                const invitationLinkReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('invitationLinks').child(invitationLinkId);
                await invitationLinkReference.set({
                    clubId: this.parameters.clubId.guidString,
                    personId: person[0]
                }, 'encrypt');
            }
        }
        for (const reasonTemplate of Object.entries(testClub.reasonTemplates))
            await reference.child('reasonTemplates').child(reasonTemplate[0]).set(reasonTemplate[1], 'encrypt');
        for (const fine of Object.entries(testClub.fines))
            await reference.child('fines').child(fine[0]).set(fine[1], 'encrypt');
    }
}

export type ClubNewTestFunctionType = FunctionType<{
    clubId: Guid;
    testClubType: TestClubType;
}, void, {
    clubId: string;
    testClubType: TestClubType;
}>;
