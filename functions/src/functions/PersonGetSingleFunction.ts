import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, HttpsError, Crypter, DatabaseReference } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { type ClubProperties } from '../types/ClubProperties';
import { Guid } from '../types/Guid';
import { type Person } from '../types/Person';

export class PersonGetSingleFunction implements FirebaseFunction<PersonGetSingleFunctionType> {
    public readonly parameters: FunctionType.Parameters<PersonGetSingleFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('PersonGetSingleFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<PersonGetSingleFunctionType>>(
            {
                userId: ParameterBuilder.value('string')
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<PersonGetSingleFunctionType>> {
        this.logger.log('PersonGetSingleFunction.executeFunction', {}, 'info');
        if (this.auth === undefined)
            throw HttpsError('permission-denied', 'The function must be called while authenticated, nobody signed in.', this.logger);
        const hashedUserId = Crypter.sha512(this.auth.uid);
        const userReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('users').child(hashedUserId);
        const userSnapshot = await userReference.snapshot();
        if (!userSnapshot.exists)
            throw HttpsError('not-found', 'Person doesn\'t exist.', this.logger);
        const { clubId, personId } = userSnapshot.value();
        await checkUserAuthentication(this.auth, new Guid(clubId), 'clubMember', this.parameters.databaseType, this.logger.nextIndent);
        const clubReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(clubId);
        const clubManagerSnapshot = await clubReference.child('authentication').child('clubManager').child(hashedUserId).snapshot();
        const personSnapshot = await clubReference.child('persons').child(personId).snapshot();
        const person = personSnapshot.value('decrypt');
        return {
            id: personId,
            name: person.name,
            fineIds: person.fineIds,
            signInData: person.signInData === null
                ? null
                : {
                    hashedUserId: person.signInData.hashedUserId,
                    signInDate: person.signInData.signInDate,
                    isAdmin: clubManagerSnapshot.exists && clubManagerSnapshot.value() === 'authenticated'
                },
            club: {
                id: clubId,
                name: (await clubReference.child('name').snapshot()).value(),
                identifier: (await clubReference.child('identifier').snapshot()).value(),
                regionCode: (await clubReference.child('regionCode').snapshot()).value(),
                inAppPaymentActive: (await clubReference.child('inAppPaymentActive').snapshot()).value()
            }
        };
    }
}

export type PersonGetSingleFunctionType = FunctionType<{
    userId: string;
}, Person.Flatten & {
    signInData: { isAdmin: boolean } | null;
    club: ClubProperties.Flatten;
}>;
