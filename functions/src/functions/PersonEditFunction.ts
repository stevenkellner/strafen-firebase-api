import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, DatabaseReference, HttpsError } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getPrivateKeys } from '../privateKeys';
import { EditType } from '../types/EditType';
import { Guid } from '../types/Guid';
import { Person } from '../types/Person';

export class PersonEditFunction implements FirebaseFunction<PersonEditFunctionType> {
    public readonly parameters: FunctionType.Parameters<PersonEditFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('PersonEditFunction.constructor', { auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<PersonEditFunctionType>>(
            {
                clubId: ParameterBuilder.build('string', Guid.fromString),
                editType: ParameterBuilder.guard('string', EditType.typeGuard),
                personId: ParameterBuilder.build('string', Guid.fromString),
                person: ParameterBuilder.optional(ParameterBuilder.build('object', Person.PersonalProperties.fromObject))
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<PersonEditFunctionType>> {
        this.logger.log('PersonEditFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, this.parameters.clubId, 'clubManager', this.parameters.databaseType, this.logger.nextIndent);
        const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('persons').child(this.parameters.personId.guidString);
        const snapshot = await reference.snapshot();
        const person = snapshot.exists ? snapshot.value('decrypt') : null;
        if (this.parameters.editType === 'delete') {
            if (person === null)
                return;
            if (person.signInData !== null)
                throw HttpsError('unavailable', 'Cannot delete registered person.', this.logger);
            await Promise.all(person.fineIds.map(async fineId => {
                const reference = DatabaseReference.base<DatabaseScheme>(getPrivateKeys(this.parameters.databaseType)).child('clubs').child(this.parameters.clubId.guidString).child('fines').child(fineId);
                const snapshot = await reference.snapshot();
                if (snapshot.exists)
                    await reference.remove();
            }));
            await reference.remove();
        } else {
            if (this.parameters.person === undefined)
                throw HttpsError('invalid-argument', 'No person name in parameters to add / update.', this.logger);
            if (this.parameters.editType === 'add' && person !== null)
                throw HttpsError('invalid-argument', 'Couldn\'t add existing person.', this.logger);
            if (this.parameters.editType === 'update' && person === null)
                throw HttpsError('invalid-argument', 'Couldn\'t update not existing person.', this.logger);
            await reference.set({
                ...Person.PersonalProperties.flatten(this.parameters.person),
                fineIds: person?.fineIds ?? [],
                signInData: person?.signInData ?? null
            }, 'encrypt');
        }
    }
}

export type PersonEditFunctionType = FunctionType<{
    clubId: Guid;
    editType: EditType;
    personId: Guid;
    person: Omit<Person.PersonalProperties, 'id'> | undefined;
}, void, {
    clubId: string;
    editType: EditType;
    personId: string;
    person: Omit<Person.PersonalProperties.Flatten, 'id'> | undefined;
}>;
