import { FirebaseFunctionDescriptor, type FirebaseFunctionsType } from 'firebase-function';
import { DeleteAllDataFunction, type DeleteAllDataFunctionType } from './functions/DeleteAllDataFunction';
import { ClubNewFunction, type ClubNewFunctionType } from './functions/ClubNewFunction';
import { ClubNewTestFunction, type ClubNewTestFunctionType } from './functions/ClubNewTestFunction';
import { PersonRegisterFunction, type PersonRegisterFunctionType } from './functions/PersonRegisterFunction';
import { PersonGetCurrentFunction, type PersonGetCurrentFunctionType } from './functions/PersonGetCurrentFunction';
import { type ClubGetIdFunctionType, ClubGetIdFunction } from './functions/ClubGetIdFunction';
import { type PersonEditFunctionType, PersonEditFunction } from './functions/PersonEditFunction';
import { type PersonGetFunctionType, PersonGetFunction } from './functions/PersonGetFunction';
import { ReasonTemplateEditFunction, type ReasonTemplateEditFunctionType } from './functions/ReasonTemplateEditFunction';
import { type ReasonTemplateGetFunctionType, ReasonTemplateGetFunction } from './functions/ReasonTemplateGetFunction';
import { FineEditFunction, type FineEditFunctionType } from './functions/FineEditFunction';
import { FineEditPayedFunction, type FineEditPayedFunctionType } from './functions/FineEditPayedFunction';
import { type FineGetFunctionType, FineGetFunction } from './functions/FineGetFunction';

export const firebaseFunctions = {
    deleteAllData: FirebaseFunctionDescriptor.create<DeleteAllDataFunctionType>(DeleteAllDataFunction),
    club: {
        new: FirebaseFunctionDescriptor.create<ClubNewFunctionType>(ClubNewFunction),
        newTest: FirebaseFunctionDescriptor.create<ClubNewTestFunctionType>(ClubNewTestFunction),
        getId: FirebaseFunctionDescriptor.create<ClubGetIdFunctionType>(ClubGetIdFunction)
    },
    person: {
        register: FirebaseFunctionDescriptor.create<PersonRegisterFunctionType>(PersonRegisterFunction),
        getCurrent: FirebaseFunctionDescriptor.create<PersonGetCurrentFunctionType>(PersonGetCurrentFunction),
        edit: FirebaseFunctionDescriptor.create<PersonEditFunctionType>(PersonEditFunction),
        get: FirebaseFunctionDescriptor.create<PersonGetFunctionType>(PersonGetFunction)
    },
    reasonTemplate: {
        edit: FirebaseFunctionDescriptor.create<ReasonTemplateEditFunctionType>(ReasonTemplateEditFunction),
        get: FirebaseFunctionDescriptor.create<ReasonTemplateGetFunctionType>(ReasonTemplateGetFunction)
    },
    fine: {
        edit: FirebaseFunctionDescriptor.create<FineEditFunctionType>(FineEditFunction),
        editPayed: FirebaseFunctionDescriptor.create<FineEditPayedFunctionType>(FineEditPayedFunction),
        get: FirebaseFunctionDescriptor.create<FineGetFunctionType>(FineGetFunction)
    }
} satisfies FirebaseFunctionsType;
