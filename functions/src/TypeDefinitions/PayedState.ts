import * as functions from "firebase-functions";
import { PrimitveDataSnapshot, undefinedAsNull, UpdateProperties, UpdatePropertiesObject } from "../utils";
import { ParameterContainer } from "./ParameterContainer";

export class PayedState {

    private constructor(
        public readonly state: "payed" | "unpayed" | "settled",
        public readonly payDate: number | null,
        public readonly inApp: boolean | null,
        public readonly updateProperties: UpdateProperties
    ) {}

    public static fromObject(object: any): PayedState {

        // Check if object is from type object
        if (typeof object !== "object")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse PayedState, expected type 'object', but bot ${object} from type '${typeof object}'`);

        // Check if type of state is a string and the value either 'payed', 'settled' or 'unpayed'.
        if (typeof object.state !== "string" || (object.state != "payed" && object.state != "settled" && object.state != "unpayed"))
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse PayedState parameter 'state'. Expected values 'payed', 'settled' or 'unpayed' from type 'string', but got '${object.state}' from type '${typeof object.state}'.`);

        // Check if type of payDate is undefined, null or number.
        if (typeof object.payDate !== "undefined" && object.payDate !== null && typeof object.payDate !== "number")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse PayedState parameter 'payDate'. Expected type 'number', undefined or null, but got '${object.payDate}' from type '${typeof object.payDate}'.`);

        // Check if type of inApp is undefined, null or boolean.
        if (typeof object.inApp !== "undefined" && object.inApp !== null && typeof object.inApp !== "boolean")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse PayedState parameter 'inApp'. Expected type 'boolean', undefined or null, but got '${object.payDate}' from type '${typeof object.payDate}'.`);

        // Check if payDate and inApp isn't null if state is 'payed'.
        if (object.state == "payed" && (object.payDate == null || object.inApp == null))
            throw new functions.https.HttpsError("invalid-argument", "Couldn't parse PayedState since state is 'payed' but payDate or inApp is null.");

        // Check if update properties is object
        if (typeof object.updateProperties !== "object")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse payed state parameter 'updateProperties', expected type object but got '${object.updateProperties}' from type '${typeof object.updateProperties}'.`);
        const updateProperties = UpdateProperties.fromObject(object.updateProperties);

        // Return payed state
        return new PayedState(object.state, undefinedAsNull(object.payDate), undefinedAsNull(object.inApp), updateProperties);
    }

    public static fromSnapshot(snapshot: PrimitveDataSnapshot): PayedState {

        // Check if data exists in snapshot
        if (!snapshot.exists())
            throw new functions.https.HttpsError("invalid-argument", "Couldn't parse PayedState since no data exists in snapshot.");

        // Get data from snapshot
        const data = snapshot.val();
        if (typeof data !== "object")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse PayedState from snapshot since data isn't an object: ${data}`);

        // Return payed state
        return PayedState.fromObject(data);
    }

    public static fromParameterContainer(container: ParameterContainer, parameterName: string): PayedState {
        return PayedState.fromObject(container.getParameter(parameterName, "object"));
    }

    public get ["serverObject"](): PayedState.ServerObject {
        return PayedState.ServerObject.fromPayedState(this);
    }

    public get ["serverObjectWithoutUpdateProperties"](): PayedState.ServerObjectWithoutUpdateProperties {
        return PayedState.ServerObjectWithoutUpdateProperties.fromPayedState(this);
    }
}

export namespace PayedState {

    export class ServerObject {
        private constructor(
            public readonly state: "payed" | "unpayed" | "settled",
            public readonly payDate: number | null,
            public readonly inApp: boolean | null,
            public readonly updateProperties: UpdatePropertiesObject
        ) {}

        public static fromPayedState(payedState: PayedState): ServerObject {
            return new ServerObject(payedState.state, payedState.payDate, payedState.inApp, payedState.updateProperties.object);
        }
    }

    export class ServerObjectWithoutUpdateProperties {
        private constructor(
            public readonly state: "payed" | "unpayed" | "settled",
            public readonly payDate: number | null,
            public readonly inApp: boolean | null,
        ) {}

        public static fromPayedState(payedState: PayedState): ServerObjectWithoutUpdateProperties {
            return new ServerObjectWithoutUpdateProperties(payedState.state, payedState.payDate, payedState.inApp);
        }
    }
}
