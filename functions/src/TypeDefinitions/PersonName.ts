import { httpsError } from "../utils";
import { LoggingProperties } from "./LoggingProperties";

export interface PersonNameObject {
    first: string;
    last: string | null;
}

// First and last name of a person
export class PersonName {

    // First name
    readonly first: string;

    // Last name (can be null)
    readonly last: string | null;

    private constructor(first: string, last: string | null) {
        this.first = first;
        this.last = last;
    }

    static fromObject(object: any, loggingProperties?: LoggingProperties): PersonName {
        loggingProperties?.append("PersonName.fromObject", {object: object});

        // Check if type of first is string
        if (typeof object.first !== "string")
            throw httpsError("invalid-argument", `Couldn't parse PersonName parameter 'first'. Expected type 'string', but got '${object.first}' from type '${typeof object.first}'.`, loggingProperties?.nextIndent);

        // Check if type of last is string
        if (typeof object.last !== "string")
            throw httpsError("invalid-argument", `Couldn't parse PersonName parameter 'last'. Expected type 'string', but got '${object.last}' from type '${typeof object.last}'.`, loggingProperties?.nextIndent);

        // Return person name
        return new PersonName(object.first, object.last);
    }

    get ["object"](): PersonNameObject {
        return {
            first: this.first,
            last: this.last,
        };
    }
}
