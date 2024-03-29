import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference, HttpsError } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { Fine } from '../types/Fine';
import { Guid } from '../types/Guid';
import { removeKey, valueChanged } from '../utils';
import { CreatorNotifier } from '../CreatorNotifier';

export class FineAddFunction implements FirebaseFunction<FineAddFunctionType> {
    public readonly parameters: FunctionType.Parameters<FineAddFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('FineAddFunction.constructor', { auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<FineAddFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                fine: ParameterBuilder.build('object', Fine.fromObjectWithId)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<FineAddFunctionType>> {
        this.logger.log('FineAddFunction.executeFunction', {}, 'info');
        const hashedUserId = await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubManager', this.parameters.databaseType, this.logger.nextIndent);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('fines').child(this.parameters.fine.id.guidString);
        const snapshot = await reference.snapshot();
        if (snapshot.exists)
            throw HttpsError('invalid-argument', 'Couldn\'t add existing fine.', this.logger);
        await reference.set(Fine.flatten(removeKey(this.parameters.fine, 'id')), 'encrypt');
        await valueChanged(this.parameters.fine.id, this.parameters.clubId, this.parameters.databaseType, 'fines');
        const personReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('persons').child(this.parameters.fine.personId.guidString);
        const personSnapshot = await personReference.snapshot();
        if (personSnapshot.exists) {
            const person = personSnapshot.value('decrypt');
            person.fineIds.push(this.parameters.fine.id.guidString);
            await personReference.set(person, 'encrypt');
            await valueChanged(this.parameters.fine.personId, this.parameters.clubId, this.parameters.databaseType, 'persons');
        }
        const creatorNotifier = new CreatorNotifier(this.parameters.clubId, hashedUserId, this.parameters.databaseType, this.logger.nextIndent);
        await creatorNotifier.notify({ state: 'fine-add', fine: this.parameters.fine });
    }
}

export type FineAddFunctionType = FunctionType<{
    clubId: Guid;
    fine: Fine;
}, void, {
    clubId: string;
    fine: Fine.Flatten;
}>;
