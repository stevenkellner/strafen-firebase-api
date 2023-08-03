import { FirebaseFunctionDescriptor, type FirebaseFunctionsType } from 'firebase-function';
import { DeleteAllDataFunction, type DeleteAllDataFunctionType } from './functions/DeleteAllDataFunction';
import { ClubNewFunction, type ClubNewFunctionType } from './functions/ClubNewFunction';
import { ClubNewTestFunction, type ClubNewTestFunctionType } from './functions/ClubNewTestFunction';
import { InvitationLinkCreateIdFunction, type InvitationLinkCreateIdFunctionType } from './functions/InvitationLinkCreateIdFunction';
import { InvitationLinkWithdrawFunction, type InvitationLinkWithdrawFunctionType } from './functions/InvitationLinkWithdrawFunction';
import { InvitationLinkGetPersonFunction, type InvitationLinkGetPersonFunctionType } from './functions/InvitationLinkGetPersonFunction';
import { type NotificationRegisterFunctionType, NotificationRegisterFunction } from './functions/NotificationRegisterFunction';
import { NotificationPushFunction, type NotificationPushFunctionType } from './functions/NotificationPushFunction';
import { PaypalMeSetFunction, PaypalMeSetFunctionType } from './functions/PaypalMeSetFunction';

import { PersonRegisterFunction, type PersonRegisterFunctionType } from './functions/PersonRegisterFunction';
import { PersonMakeManagerFunction, type PersonMakeManagerFunctionType } from './functions/PersonMakeManagerFunction';
import { PersonGetCurrentFunction, type PersonGetCurrentFunctionType } from './functions/PersonGetCurrentFunction';
import { PersonAddFunction, type PersonAddFunctionType } from './functions/PersonAddFunction';
import { PersonUpdateFunction, type PersonUpdateFunctionType } from './functions/PersonUpdateFunction';
import { PersonDeleteFunction, type PersonDeleteFunctionType } from './functions/PersonDeleteFunction';
import { PersonGetFunction, type PersonGetFunctionType } from './functions/PersonGetFunction';
import { PersonGetSingleFunction, type PersonGetSingleFunctionType } from './functions/PersonGetSingleFunction';

import { ReasonTemplateAddFunction, type ReasonTemplateAddFunctionType } from './functions/ReasonTemplateAddFunction';
import { ReasonTemplateUpdateFunction, type ReasonTemplateUpdateFunctionType } from './functions/ReasonTemplateUpdateFunction';
import { ReasonTemplateDeleteFunction, type ReasonTemplateDeleteFunctionType } from './functions/ReasonTemplateDeleteFunction';
import { ReasonTemplateGetFunction, type ReasonTemplateGetFunctionType } from './functions/ReasonTemplateGetFunction';
import { ReasonTemplateGetSingleFunction, type ReasonTemplateGetSingleFunctionType } from './functions/ReasonTemplateGetSingleFunction';

import { FineAddFunction, type FineAddFunctionType } from './functions/FineAddFunction';
import { FineUpdateFunction, type FineUpdateFunctionType } from './functions/FineUpdateFunction';
import { FineDeleteFunction, type FineDeleteFunctionType } from './functions/FineDeleteFunction';
import { FineEditPayedFunction, type FineEditPayedFunctionType } from './functions/FineEditPayedFunction';
import { FineGetFunction, type FineGetFunctionType } from './functions/FineGetFunction';
import { FineGetSingleFunction, type FineGetSingleFunctionType } from './functions/FineGetSingleFunction';

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
        add: FirebaseFunctionDescriptor.create<PersonAddFunctionType>(PersonAddFunction),
        update: FirebaseFunctionDescriptor.create<PersonUpdateFunctionType>(PersonUpdateFunction),
        delete: FirebaseFunctionDescriptor.create<PersonDeleteFunctionType>(PersonDeleteFunction),
        get: FirebaseFunctionDescriptor.create<PersonGetFunctionType>(PersonGetFunction),
        getSingle: FirebaseFunctionDescriptor.create<PersonGetSingleFunctionType>(PersonGetSingleFunction)
    },
    reasonTemplate: {
        add: FirebaseFunctionDescriptor.create<ReasonTemplateAddFunctionType>(ReasonTemplateAddFunction),
        update: FirebaseFunctionDescriptor.create<ReasonTemplateUpdateFunctionType>(ReasonTemplateUpdateFunction),
        delete: FirebaseFunctionDescriptor.create<ReasonTemplateDeleteFunctionType>(ReasonTemplateDeleteFunction),
        get: FirebaseFunctionDescriptor.create<ReasonTemplateGetFunctionType>(ReasonTemplateGetFunction),
        getSingle: FirebaseFunctionDescriptor.create<ReasonTemplateGetSingleFunctionType>(ReasonTemplateGetSingleFunction)
    },
    fine: {
        add: FirebaseFunctionDescriptor.create<FineAddFunctionType>(FineAddFunction),
        update: FirebaseFunctionDescriptor.create<FineUpdateFunctionType>(FineUpdateFunction),
        delete: FirebaseFunctionDescriptor.create<FineDeleteFunctionType>(FineDeleteFunction),
        editPayed: FirebaseFunctionDescriptor.create<FineEditPayedFunctionType>(FineEditPayedFunction),
        get: FirebaseFunctionDescriptor.create<FineGetFunctionType>(FineGetFunction),
        getSingle: FirebaseFunctionDescriptor.create<FineGetSingleFunctionType>(FineGetSingleFunction)
    },
    paypalMe: {
        set: FirebaseFunctionDescriptor.create<PaypalMeSetFunctionType>(PaypalMeSetFunction)
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
