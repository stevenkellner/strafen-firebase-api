import { FirebaseFunctionDescriptor, type FirebaseFunctionsType } from 'firebase-function';
import { DeleteAllDataFunction, type DeleteAllDataFunctionType } from './functions/DeleteAllDataFunction';
import { ClubNewFunction, type ClubNewFunctionType } from './functions/ClubNewFunction';
import { ClubNewTestFunction, type ClubNewTestFunctionType } from './functions/ClubNewTestFunction';
import { PersonRegisterFunction, type PersonRegisterFunctionType } from './functions/PersonRegisterFunction';
import { PersonGetCurrentFunction, type PersonGetCurrentFunctionType } from './functions/PersonGetCurrentFunction';
import { type PersonEditFunctionType, PersonEditFunction } from './functions/PersonEditFunction';
import { type PersonGetFunctionType, PersonGetFunction } from './functions/PersonGetFunction';
import { ReasonTemplateEditFunction, type ReasonTemplateEditFunctionType } from './functions/ReasonTemplateEditFunction';
import { type ReasonTemplateGetFunctionType, ReasonTemplateGetFunction } from './functions/ReasonTemplateGetFunction';
import { FineEditFunction, type FineEditFunctionType } from './functions/FineEditFunction';
import { FineEditPayedFunction, type FineEditPayedFunctionType } from './functions/FineEditPayedFunction';
import { type FineGetFunctionType, FineGetFunction } from './functions/FineGetFunction';
import { InvitationLinkCreateIdFunction, type InvitationLinkCreateIdFunctionType } from './functions/InvitationLinkCreateIdFunction';
import { InvitationLinkWithdrawFunction, type InvitationLinkWithdrawFunctionType } from './functions/InvitationLinkWithdrawFunction';
import { InvitationLinkGetPersonFunction, type InvitationLinkGetPersonFunctionType } from './functions/InvitationLinkGetPersonFunction';
import { PersonMakeManagerFunction, type PersonMakeManagerFunctionType } from './functions/PersonMakeManagerFunction';
import { type NotificationRegisterFunctionType, NotificationRegisterFunction } from './functions/NotificationRegisterFunction';
import { NotificationPushFunction, type NotificationPushFunctionType } from './functions/NotificationPushFunction';

export const firebaseFunctions = {
    deleteAllData: FirebaseFunctionDescriptor.create<DeleteAllDataFunctionType>(DeleteAllDataFunction),
    club: {
        new: FirebaseFunctionDescriptor.create<ClubNewFunctionType>(ClubNewFunction),
        newTest: FirebaseFunctionDescriptor.create<ClubNewTestFunctionType>(ClubNewTestFunction)
    },
    person: {
        register: FirebaseFunctionDescriptor.create<PersonRegisterFunctionType>(PersonRegisterFunction),
        makeManager: FirebaseFunctionDescriptor.create<PersonMakeManagerFunctionType>(PersonMakeManagerFunction),
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
    },
    invitationLink: {
        createId: FirebaseFunctionDescriptor.create<InvitationLinkCreateIdFunctionType>(InvitationLinkCreateIdFunction),
        withdraw: FirebaseFunctionDescriptor.create<InvitationLinkWithdrawFunctionType>(InvitationLinkWithdrawFunction),
        getPerson: FirebaseFunctionDescriptor.create<InvitationLinkGetPersonFunctionType>(InvitationLinkGetPersonFunction)
    },
    notification: {
        register: FirebaseFunctionDescriptor.create<NotificationRegisterFunctionType>(NotificationRegisterFunction),
        push: FirebaseFunctionDescriptor.create<NotificationPushFunctionType>(NotificationPushFunction)
    }
} satisfies FirebaseFunctionsType;
