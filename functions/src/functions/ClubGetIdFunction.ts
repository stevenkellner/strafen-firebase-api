import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, HttpsError, DatabaseReference } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { Guid } from '../types/Guid';

export class ClubGetIdFunction implements FirebaseFunction<ClubGetIdFunctionType> {
    public readonly parameters: FunctionType.Parameters<ClubGetIdFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('ClubGetIdFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<ClubGetIdFunctionType>>(
            {
                identifier: ParameterBuilder.value('string')
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<ClubGetIdFunctionType>> {
        this.logger.log('ClubGetIdFunction.executeFunction', {}, 'info');
        if (this.auth === undefined)
            throw HttpsError('permission-denied', 'The function must be called while authenticated, nobody signed in.', this.logger);
        const clubIdentifierReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubIdentifiers').child(this.parameters.identifier);
        const clubIdentifierSnapshot = await clubIdentifierReference.snapshot();
        if (!clubIdentifierSnapshot.exists)
            throw HttpsError('not-found', 'Club doesn\'t exist.', this.logger);
        const clubId = clubIdentifierSnapshot.value();
        await checkUserAuthentication(this.auth, new Guid(clubId), 'clubMember', this.parameters.databaseType, this.logger.nextIndent);
        return clubId;
    }
}

export type ClubGetIdFunctionType = FunctionType<{
    identifier: string;
}, string>;
