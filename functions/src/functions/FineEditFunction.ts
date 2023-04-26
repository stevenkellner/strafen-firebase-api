import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference, HttpsError } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { EditType } from '../types/EditType';
import { Fine } from '../types/Fine';
import { Guid } from '../types/Guid';

export class FineEditFunction implements FirebaseFunction<FineEditFunctionType> {
    public readonly parameters: FunctionType.Parameters<FineEditFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('FineEditFunction.constructor', { auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<FineEditFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                editType: ParameterBuilder.guard('string', EditType.typeGuard),
                fineId: ParameterBuilder.build('string', Guid.fromString),
                fine: ParameterBuilder.optional(ParameterBuilder.build('object', Fine.fromObject))
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<FineEditFunctionType>> {
        this.logger.log('FineEditFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubManager', this.parameters.databaseType, this.logger.nextIndent);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('fines').child(this.parameters.fineId.guidString);
        const snapshot = await reference.snapshot();
        if (this.parameters.editType === 'delete') {
            if (snapshot.exists) {
                const fine = snapshot.value('decrypt');
                await reference.remove();
                const personReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('persons').child(fine.personId);
                const personSnapshot = await personReference.snapshot();
                if (personSnapshot.exists) {
                    const person = personSnapshot.value('decrypt');
                    person.fineIds = person.fineIds.filter(fineId => fineId !== this.parameters.fineId.guidString);
                    await personReference.set(person, 'encrypt');
                }
            }
        } else {
            if (this.parameters.fine === undefined)
                throw HttpsError('invalid-argument', 'No fine in parameters to add / update.', this.logger);
            if (this.parameters.editType === 'add' && snapshot.exists)
                throw HttpsError('invalid-argument', 'Couldn\'t add existing fine.', this.logger);
            if (this.parameters.editType === 'update' && !snapshot.exists)
                throw HttpsError('invalid-argument', 'Couldn\'t update not existing fine.', this.logger);
            await reference.set(Fine.flatten(this.parameters.fine), 'encrypt');
            if (this.parameters.editType === 'add') {
                const personReference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('persons').child(this.parameters.fine.personId.guidString);
                const personSnapshot = await personReference.snapshot();
                if (personSnapshot.exists) {
                    const person = personSnapshot.value('decrypt');
                    person.fineIds.push(this.parameters.fineId.guidString);
                    await personReference.set(person, 'encrypt');
                }
            }
        }
    }
}

export type FineEditFunctionType = FunctionType<{
    clubId: Guid;
    editType: EditType;
    fineId: Guid;
    fine: Omit<Fine, 'id'> | undefined;
}, void, {
    clubId: string;
    editType: EditType;
    fineId: string;
    fine: Omit<Fine.Flatten, 'id'> | undefined;
}>;
