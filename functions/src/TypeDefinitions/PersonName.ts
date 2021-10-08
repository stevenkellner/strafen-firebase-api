import { httpsError } from "../utils";
import { LoggingProperties } from "./LoggingProperties";

export class PersonName {

    public constructor(
        public readonly first: string,
        public readonly last: string | null
    ) {}

    get ["serverObject"](): PersonName.ServerObject {
        return {
            first: this.first,
            last: this.last,
        };
    }
}

export namespace PersonName {

    export interface ServerObject {
        first: string;
        last: string | null;
    }

    export class Builder {

        public fromValue(value: any, loggingProperties?: LoggingProperties): PersonName {
            loggingProperties?.append("PersonName.Builder.fromValue", {value: value});

            // Check if value is from type object
            if (typeof value !== "object")
                throw httpsError("invalid-argument", `Couldn't parse PersonName, expected type 'object', but bot ${value} from type '${typeof value}'`, loggingProperties);

            // Check if type of first is string
            if (typeof value.first !== "string")
                throw httpsError("invalid-argument", `Couldn't parse PersonName parameter 'first'. Expected type 'string', but got '${value.first}' from type '${typeof value.first}'.`, loggingProperties);

            // Check if type of last is string
            if (typeof value.last !== "string")
                throw httpsError("invalid-argument", `Couldn't parse PersonName parameter 'last'. Expected type 'string', but got '${value.last}' from type '${typeof value.last}'.`, loggingProperties);

            // Return person name
            return new PersonName(value.first, value.last);
        }
    }
}
