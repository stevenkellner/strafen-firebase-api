import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference, HttpsError } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { ClubProperties } from '../types/ClubProperties';
import { Guid } from '../types/Guid';
import { PersonName } from '../types/PersonName';

export class ClubNewFunction implements FirebaseFunction<ClubNewFunctionType> {
    public readonly parameters: FunctionType.Parameters<ClubNewFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('ClubNewFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<ClubNewFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                clubProperties: ParameterBuilder.build('object', ClubProperties.fromObject),
                personId: ParameterBuilder.build('string', Guid.fromString),
                personName: ParameterBuilder.build('object', PersonName.fromObject)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<ClubNewFunctionType>> {
        this.logger.log('ClubNewFunction.executeFunction', {}, 'info');
        const hashedUserId = await checkUserAuthentication(this.auth, this.parameters.clubId, [], this.parameters.databaseType, this.logger.nextIndent);
        await this.checkClubExists();
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString);
        await reference.child('name').set(this.parameters.clubProperties.name);
        await reference.child('identifier').set(this.parameters.clubProperties.identifier);
        await reference.child('regionCode').set(this.parameters.clubProperties.regionCode);
        await reference.child('inAppPaymentActive').set(this.parameters.clubProperties.inAppPaymentActive);
        for (const authenticationType of ['clubManager', 'clubMember'] as const)
            await reference.child('authentication').child(authenticationType).child(hashedUserId).set('authenticated');
        await reference.child('persons').child(this.parameters.personId.guidString).set({
            name: PersonName.flatten(this.parameters.personName),
            fineIds: [],
            signInData: {
                hashedUserId: hashedUserId,
                signInDate: new Date().toISOString()
            }
        }, 'encrypt');
        const userReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('users').child(hashedUserId);
        const userSnapshot = await userReference.snapshot();
        if (userSnapshot.exists)
            throw HttpsError('already-exists', 'User is already registered.', this.logger);
        await userReference.set({
            clubId: this.parameters.clubId.guidString,
            personId: this.parameters.personId.guidString
        });
        const clubIdentifierReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubIdentifiers').child(this.parameters.clubProperties.identifier);
        await clubIdentifierReference.set(this.parameters.clubId.guidString);
    }

    private async checkClubExists() {
        const clubIdentifierReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubIdentifiers').child(this.parameters.clubProperties.identifier);
        const clubIdentifierSnapshot = await clubIdentifierReference.snapshot();
        if (clubIdentifierSnapshot.exists)
            throw HttpsError('already-exists', 'Club identifier already exists.', this.logger);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString);
        const snapshot = await reference.snapshot();
        if (snapshot.exists)
            throw HttpsError('already-exists', 'Club with specified id already exists.', this.logger);
    }
}

export type ClubNewFunctionType = FunctionType<{
    clubId: Guid;
    clubProperties: Omit<ClubProperties, 'id'>;
    personId: Guid;
    personName: PersonName;
}, void, {
    clubId: string;
    clubProperties: Omit<ClubProperties.Flatten, 'id'>;
    personId: string;
    personName: PersonName.Flatten;
}>;
