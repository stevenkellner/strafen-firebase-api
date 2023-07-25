import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { Guid } from '../types/Guid';
import { notifyCreator } from '../utils';
import { Fine } from '../types/Fine';

export class FineDeleteFunction implements FirebaseFunction<FineDeleteFunctionType> {
    public readonly parameters: FunctionType.Parameters<FineDeleteFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('FineDeleteFunction.constructor', { auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<FineDeleteFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                fineId: ParameterBuilder.build('string', Guid.fromString)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<FineDeleteFunctionType>> {
        this.logger.log('FineDeleteFunction.executeFunction', {}, 'info');
        const hashedUserId = await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubManager', this.parameters.databaseType, this.logger.nextIndent);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('fines').child(this.parameters.fineId.guidString);
        const snapshot = await reference.snapshot();
        if (!snapshot.exists)
            return;
        const fine = snapshot.value('decrypt');
        await reference.remove();
        const personReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('persons').child(fine.personId);
        const personSnapshot = await personReference.snapshot();
        if (personSnapshot.exists) {
            const person = personSnapshot.value('decrypt');
            person.fineIds = person.fineIds.filter(fineId => fineId !== this.parameters.fineId.guidString);
            await personReference.set(person, 'encrypt');
        }

        await notifyCreator({ state: 'fine-delete', fine: Fine.concrete(fine) }, this.parameters.clubId, hashedUserId, this.parameters.databaseType, this.logger.nextIndent);
    }
}

export type FineDeleteFunctionType = FunctionType<{
    clubId: Guid;
    fineId: Guid;
}, void, {
    clubId: string;
    fineId: string;
}>;
