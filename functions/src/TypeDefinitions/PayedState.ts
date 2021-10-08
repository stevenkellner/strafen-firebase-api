import { httpsError, undefinedAsNull } from "../utils";
import { LoggingProperties } from "./LoggingProperties";

export class PayedState {

    public constructor(
        public readonly property: PayedState.Property
    ) {}

    public get ["serverObject"](): PayedState.ServerObject {
        return {
            state: this.property.state,
            payDate: undefinedAsNull((this.property as any).payDate),
            inApp: undefinedAsNull((this.property as any).inApp),
        };
    }
}

export namespace PayedState {

    export type Property = {
        state: "payed",
        inApp: boolean,
        payDate: number,
    } | {
        state: "unpayed",
    } | {
        state: "settled",
    };

    export class Builder {
        public fromValue(value: any, loggingProperties?: LoggingProperties): PayedState {
            loggingProperties?.append("PayedState.Builder.fromValue", {object: value});

            // Check if value is from type object
            if (typeof value !== "object")
                throw httpsError("invalid-argument", `Couldn't parse PayedState, expected type 'object', but bot ${value} from type '${typeof value}'`, loggingProperties);

            // Check if type of state is a string and the value either 'payed', 'settled' or 'unpayed'.
            if (typeof value.state !== "string" || (value.state != "payed" && value.state != "settled" && value.state != "unpayed"))
                throw httpsError("invalid-argument", `Couldn't parse PayedState parameter 'state'. Expected type 'string', but got '${value.state}' from type '${typeof value.state}'.`, loggingProperties);

            if (value.state == "payed") {

                // Check if type of payDate is undefined, null or number.
                if (typeof value.payDate !== "number")
                    throw httpsError("invalid-argument", `Couldn't parse PayedState parameter 'payDate'. Expected type 'number', undefined or null, but got '${value.payDate}' from type '${typeof value.payDate}'.`, loggingProperties);

                // Check if type of inApp is undefined, null or boolean.
                if (typeof value.inApp !== "boolean")
                    throw httpsError("invalid-argument", `Couldn't parse PayedState parameter 'inApp'. Expected type 'boolean', undefined or null, but got '${value.payDate}' from type '${typeof value.payDate}'.`, loggingProperties);

                // Return payed state
                return new PayedState({state: value.state, payDate: value.payDate, inApp: value.inApp});

            } else if (value.state == "unpayed")
                return new PayedState({state: "unpayed"});
            else if (value.state == "settled")
                return new PayedState({state: "settled"});

            // Throw error since value.state isn't 'payed', 'settled' or 'unpayed'.
            throw httpsError("invalid-argument", `Couldn't parse PayedState parameter 'state'. Expected values 'payed', 'settled' or 'unpayed', but got '${value.state}' from type '${typeof value.state}'.`, loggingProperties);
        }
    }

    export interface ServerObject {
        state: "payed" | "unpayed" | "settled",
        payDate: number | null,
        inApp: boolean | null,
    }
}
