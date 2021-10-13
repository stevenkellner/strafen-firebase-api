import { httpsError } from "../utils";
import { LoggingProperties } from "./LoggingProperties";

export class PayedState {

    public constructor(
        public readonly property: PayedState.Property
    ) {}

    public get ["serverObject"](): PayedState.ServerObject {
        switch (this.property.state) {
        case "payed":
            return {
                state: this.property.state,
                payDate: this.property.payDate.toISOString(),
                inApp: this.property.inApp,
            };
        case "unpayed":
            return {
                state: this.property.state,
                payDate: null,
                inApp: null,
            };
        case "settled":
            return {
                state: this.property.state,
                payDate: null,
                inApp: null,
            };
        }
    }
}

export namespace PayedState {

    export type Property = {
        state: "payed",
        inApp: boolean,
        payDate: Date,
    } | {
        state: "unpayed",
    } | {
        state: "settled",
    };

    export class Builder {
        public fromValue(value: any, loggingProperties: LoggingProperties): PayedState {
            loggingProperties.append("PayedState.Builder.fromValue", {object: value});

            // Check if value is from type object
            if (typeof value !== "object")
                throw httpsError("invalid-argument", `Couldn't parse PayedState, expected type 'object', but bot ${value} from type '${typeof value}'`, loggingProperties);

            // Check if type of state is a string and the value either 'payed', 'settled' or 'unpayed'.
            if (typeof value.state !== "string" || (value.state != "payed" && value.state != "settled" && value.state != "unpayed"))
                throw httpsError("invalid-argument", `Couldn't parse PayedState parameter 'state'. Expected type 'string', but got '${value.state}' from type '${typeof value.state}'.`, loggingProperties);

            if (value.state == "payed") {

                // Check if payDate is a iso string
                if (typeof value.payDate !== "string" || isNaN(new Date(value.payDate).getTime()))
                    throw httpsError("invalid-argument", `Couldn't parse PayedState parameter 'payDate', expected iso string but got '${value.payDate}' from type ${typeof value.payDate}`, loggingProperties);

                // Check if type of inApp is undefined, null or boolean.
                if (typeof value.inApp !== "boolean")
                    throw httpsError("invalid-argument", `Couldn't parse PayedState parameter 'inApp'. Expected type 'boolean', undefined or null, but got '${value.inApp}' from type '${typeof value.inApp}'.`, loggingProperties);

                // Return payed state
                return new PayedState({state: value.state, payDate: new Date(value.payDate), inApp: value.inApp});

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
        payDate: string | null,
        inApp: boolean | null,
    }
}
