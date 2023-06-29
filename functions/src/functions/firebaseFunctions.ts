import { FirebaseFunctionDescriptor, type FirebaseFunctionsType } from 'firebase-function';
import { DeleteAllDataFunction, type DeleteAllDataFunctionType } from './DeleteAllDataFunction';
import { ClubNewFunction, type ClubNewFunctionType } from './ClubNewFunction';
import { ClubNewTestFunction, type ClubNewTestFunctionType } from './ClubNewTestFunction';
import { PersonRegisterFunction, type PersonRegisterFunctionType } from './PersonRegisterFunction';
import { PersonGetCurrentFunction, type PersonGetCurrentFunctionType } from './PersonGetCurrentFunction';
import { type PersonEditFunctionType, PersonEditFunction } from './PersonEditFunction';
import { type PersonGetFunctionType, PersonGetFunction } from './PersonGetFunction';
import { ReasonTemplateEditFunction, type ReasonTemplateEditFunctionType } from './ReasonTemplateEditFunction';
import { type ReasonTemplateGetFunctionType, ReasonTemplateGetFunction } from './ReasonTemplateGetFunction';
import { FineEditFunction, type FineEditFunctionType } from './FineEditFunction';
import { FineEditPayedFunction, type FineEditPayedFunctionType } from './FineEditPayedFunction';
import { type FineGetFunctionType, FineGetFunction } from './FineGetFunction';
import { InvitationLinkCreateIdFunction, type InvitationLinkCreateIdFunctionType } from './InvitationLinkCreateIdFunction';
import { InvitationLinkWithdrawFunction, type InvitationLinkWithdrawFunctionType } from './InvitationLinkWithdrawFunction';
import { InvitationLinkGetPersonFunction, type InvitationLinkGetPersonFunctionType } from './InvitationLinkGetPersonFunction';
import { PersonMakeManagerFunction, type PersonMakeManagerFunctionType } from './PersonMakeManagerFunction';
import { type NotificationRegisterFunctionType, NotificationRegisterFunction } from './NotificationRegisterFunction';
import { NotificationPushFunction, type NotificationPushFunctionType } from './NotificationPushFunction';

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
