import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterContainer, ParameterParser, type FunctionType, HttpsError, Crypter, DatabaseReference } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { type ClubProperties } from '../types/ClubProperties';
import { Guid } from '../types/Guid';
import { type Person } from '../types/Person';

export class PersonGetCurrentFunction implements FirebaseFunction<PersonGetCurrentFunctionType> {
    public readonly parameters: FunctionType.Parameters<PersonGetCurrentFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('PersonGetCurrentFunction.constructor', { auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<PersonGetCurrentFunctionType>>({}, this.logger.nextIndent);
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<PersonGetCurrentFunctionType>> {
        this.logger.log('PersonGetCurrentFunction.executeFunction', {}, 'info');
        if (this.auth === undefined)
            throw HttpsError('permission-denied', 'The function must be called while authenticated, nobody signed in.', this.logger);
        const hashedUserId = Crypter.sha512(this.auth.uid);
        const userReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('users').child(hashedUserId);
        const userSnapshot = await userReference.snapshot();
        if (!userSnapshot.exists)
            throw HttpsError('not-found', 'Person doesn\'t exist.', this.logger);
        const { clubId, personId } = userSnapshot.value('decrypt');
        await checkUserAuthentication(this.auth, new Guid(clubId), 'clubMember', this.parameters.databaseType, this.logger.nextIndent);
        const clubReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(clubId);
        const personSnapshot = await clubReference.child('persons').child(personId).snapshot();
        const person = personSnapshot.value('decrypt');
        if (person.signInData === null)
            throw HttpsError('internal', 'Couldn\'t get sign in data from logged in person.', this.logger);
        return {
            id: personId,
            name: person.name,
            fineIds: person.fineIds,
            signInData: person.signInData,
            isInvited: person.isInvited,
            club: {
                id: clubId,
                name: (await clubReference.child('name').snapshot()).value()
            }
        };
    }
}

export type PersonGetCurrentFunctionType = FunctionType<Record<string, never>, Person.Flatten & {
    signInData: object;
    club: ClubProperties.Flatten;
}>;
