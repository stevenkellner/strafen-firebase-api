import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference, HttpsError } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { Guid } from '../types/Guid';
import { PayedState } from '../types/PayedState';

export class FineEditPayedFunction implements FirebaseFunction<FineEditPayedFunctionType> {
    public readonly parameters: FunctionType.Parameters<FineEditPayedFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('FineEditPayedFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<FineEditPayedFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                fineId: ParameterBuilder.build('string', Guid.fromString),
                payedState: ParameterBuilder.build('object', PayedState.fromObject)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<FineEditPayedFunctionType>> {
        this.logger.log('FineEditPayedFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubManager', this.parameters.databaseType, this.logger.nextIndent);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('fines').child(this.parameters.fineId.guidString);
        const snapshot = await reference.snapshot();
        if (!snapshot.exists)
            throw HttpsError('not-found', 'Couldn\t found fine to edit payed state.', this.logger);
        const fine = snapshot.value('decrypt');
        await reference.set({
            ...fine,
            payedState: PayedState.flatten(this.parameters.payedState)
        }, 'encrypt');
    }
}

export type FineEditPayedFunctionType = FunctionType<{
    clubId: Guid;
    fineId: Guid;
    payedState: PayedState;
}, void>;
