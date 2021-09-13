import * as functions from "firebase-functions";

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

    static fromObject(object: any): PersonName {

        // Check if type of first is string
        if (typeof object.first !== "string")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse PersonName parameter 'first'. Expected type 'string', but got '${object.first}' from type '${typeof object.first}'.`);

        // Check if type of last is string
        if (typeof object.last !== "string")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse PersonName parameter 'last'. Expected type 'string', but got '${object.last}' from type '${typeof object.last}'.`);

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
