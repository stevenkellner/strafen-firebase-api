import {guid} from "./guid";
import * as functions from "firebase-functions";
import {PrimitveDataSnapshot} from "../utils";
import {ParameterContainer} from "./ParameterContainer";
import {PersonName, PersonNameObject} from "./PersonName";

export interface PersonObject {
    id: string;
    name: PersonNameObject;
}

interface PersonObjectWithoutId {
    name: PersonNameObject;
}

/**
 *  Contains all properties of a person
 */
export class Person {

    /**
     * Id of person
     */
    readonly id: guid;

    /**
     * Reason message of the person
     */
    readonly name: PersonName;

    private constructor(id: guid, name: PersonName) {
        this.id = id;
        this.name = name;
    }

    /**
     * Constructs Person from an object or throws a HttpsError if parsing failed.
     * @param {any} object Object to parse Person from.
     * @return {Person} Parsed Person from specified object.
     */
    static fromObject(object: any): Person {

        // Check if type of id is string
        if (typeof object.id !== "string")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse Person parameter 'id'. Expected type 'string', but got '${object.id}' from type '${typeof object.id}'.`);
        const id = guid.fromString(object.id);

        // Check if type of name is object
        if (typeof object.name !== "object")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse Person parameter 'name'. Expected type 'object', but got '${object.name}' from type '${typeof object.name}'.`);
        const name = PersonName.fromObject(object.name);

        // Return person
        return new Person(id, name);
    }

    static fromSnapshot(snapshot: PrimitveDataSnapshot): Person {

        // Check if data exists in snapshot
        if (!snapshot.exists())
            throw new functions.https.HttpsError("invalid-argument", "Couldn't parse Person since no data exists in snapshot.");

        // Get id
        const idString = snapshot.key;
        if (idString == null)
            throw new functions.https.HttpsError("invalid-argument", "Couldn't parse Person since snapshot has an invalid key.");

        const data = snapshot.val();
        if (typeof data !== "object")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse Person from snapshot since data isn't an object: ${data}`);

        return Person.fromObject({
            id: idString,
            ...data,
        });
    }

    /**
     * Constructs Person from parameter of parameter container with specified parameter name
     * or throws a HttpsError if parsing failed.
     * @param {ParameterContainer} container Parameter container to get parameter from.
     * @param {string} parameterName Name of parameter from parameter container.
     * @return {Person} Parsed Person from specified parameter.
     */
    static fromParameterContainer(container: ParameterContainer, parameterName: string): Person {
        return Person.fromObject(container.getParameter(parameterName, "object"));
    }


    /**
     * Returns person as object without id.
     * @return {PersonObjectWithoutId} Person as object without id
     */
    get ["objectWithoutId"](): PersonObjectWithoutId {
        return {
            name: this.name.object,
        };
    }

    /**
     * Returns reason template as object.
     * @return {PersonObject} Reason template as object
     */
    get ["object"](): PersonObject {
        return {
            id: this.id.guidString,
            name: this.name.object,
        };
    }
}
