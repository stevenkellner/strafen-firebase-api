import {ParameterContainer} from "./ParameterContainer";
import * as functions from "firebase-functions";

/**
 * Types of list item change
 */
export class ChangeType {

    /**
     * Type of the change.
     */
    readonly value: "delete" | "update";

    /**
     * Initializes change type with string value.
     * @param {"delete" | "update"} value Value of the change type.
     */
    private constructor(value: "delete" | "update") {
        this.value = value;
    }

    /**
     * Constructs change type from an string or throws a HttpsError if parsing failed.
     * @param {string} value Value of the change type.
     * @return {ChangeType} Parsed change type.
     */
    static fromString(value: string): ChangeType {
        if (value == "delete" || value == "update")
            return new ChangeType(value);
        throw new functions.https.HttpsError("invalid-argument", `Couldn't parse ChangeType, expected 'delete' or 'update', but got ${value} instead.`);
    }

    /**
     * Constructs change type from parameter of parameter container with specified parameter name
     * or throws a HttpsError if parsing failed.
     * @param {ParameterContainer} container Parameter container to get parameter from.
     * @param {string} parameterName Name of parameter from parameter container.
     * @return {ChangeType} Parsed change type.
     */
    static fromParameterContainer(container: ParameterContainer, parameterName: string): ChangeType {
        return ChangeType.fromString(container.getParameter(parameterName, "string"));
    }
}
