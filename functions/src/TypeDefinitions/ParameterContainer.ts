import * as functions from "firebase-functions";

/**
 * All valid parameter types: string, number, bigint, boolean or object.
 */
type ValidParameterTypes = "string" | "number" | "bigint" | "boolean" | "object";

/**
 * Contains all parameters for firebase function.
 */
export class ParameterContainer {

    /**
     * Data from firebase funtion to get parameters from.
     */
    private data: any;

    /**
     * Initializes parameter container with firebase function data.
     * @param {any} data Data from firebase funtion to get parameters from.
     */
    constructor(data: any) {
        this.data = data;
    }

    /**
     * Returns parameter with specified name and expected type or null if parameter is null or undefined.
     * @param {string} parameterName Name of parameter to get.
     * @param {ValidParameterTypes} expectedType Expected type of the parameter.
     * @return {any | null} Parameter with specified name.
     */
    getOptionalParameter(parameterName: string, expectedType: ValidParameterTypes): any | null {
        if (this.data == null)
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse '${parameterName}'. No parameters specified to this function.`);
        const parameter = this.data[parameterName];
        if (parameter === null || parameter === undefined)
            return null;
        if (typeof parameter !== expectedType)
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse '${parameterName}'. Expected type '${expectedType}', but got '${parameter}' from type '${typeof parameter}'.`);
        return parameter;
    }

    /**
     * Returns parameter with specified name and expected type.
     * @param {string} parameterName Name of parameter to get.
     * @param {ValidParameterTypes} expectedType Expected type of the parameter.
     * @return {any} Parameter with specified name.
     */
    getParameter(parameterName: string, expectedType: ValidParameterTypes): any {
        const value = this.getOptionalParameter(parameterName, expectedType);
        if (value == null)
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse '${parameterName}'. Expected type '${expectedType}', but got undefined or null.`);
        return value;
    }
}
