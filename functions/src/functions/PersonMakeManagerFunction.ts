import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference, HttpsError } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { getPrivateKeys } from '../privateKeys';
import { Guid } from '../types/Guid';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';

export class PersonMakeManagerFunction implements FirebaseFunction<PersonMakeManagerFunctionType> {
    public readonly parameters: FunctionType.Parameters<PersonMakeManagerFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('PersonMakeManagerFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<PersonMakeManagerFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                personId: ParameterBuilder.build('string', Guid.fromString)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<PersonMakeManagerFunctionType>> {
        this.logger.log('PersonMakeManagerFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubManager', this.parameters.databaseType, this.logger.nextIndent);
        const personReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('persons').child(this.parameters.personId.guidString);
        const personSnapshot = await personReference.snapshot();
        if (!personSnapshot.exists)
            throw HttpsError('not-found', 'Couldn\'t make person manager. Person not found.', this.logger);
        const hashedUserId = personSnapshot.value('decrypt').signInData?.hashedUserId;
        if (hashedUserId === undefined)
            throw HttpsError('unavailable', 'Couldn\'t make person manager. Person is not signed in.', this.logger);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('authentication').child('clubManager').child(hashedUserId);
        await reference.set('authenticated');
    }
}

export type PersonMakeManagerFunctionType = FunctionType<{
    clubId: Guid;
    personId: Guid;
}, void, {
    clubId: string;
    personId: string;
}>;
