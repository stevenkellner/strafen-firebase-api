import { httpsError } from "../utils";
import { LoggingProperties } from "./LoggingProperties";

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
    getOptionalParameter(parameterName: string, expectedType: ValidParameterTypes, loggingProperties?: LoggingProperties): any | null {
        loggingProperties?.append("ParameterContainer.getOptionalParameter", {parameterName: parameterName, expectedType: expectedType});
        if (this.data == null)
            throw httpsError("invalid-argument", `Couldn't parse '${parameterName}'. No parameters specified to this function.`, loggingProperties);
        const parameter = this.data[parameterName];
        if (parameter === null || parameter === undefined)
            return null;
        if (typeof parameter !== expectedType)
            throw httpsError("invalid-argument", `Couldn't parse '${parameterName}'. Expected type '${expectedType}', but got '${parameter}' from type '${typeof parameter}'.`, loggingProperties);
        return parameter;
    }

    /**
     * Returns parameter with specified name and expected type.
     * @param {string} parameterName Name of parameter to get.
     * @param {ValidParameterTypes} expectedType Expected type of the parameter.
     * @return {any} Parameter with specified name.
     */
    getParameter(parameterName: string, expectedType: ValidParameterTypes, loggingProperties?: LoggingProperties): any {
        loggingProperties?.append("ParameterContainer.getParameter", {parameterName: parameterName, expectedType: expectedType});
        const value = this.getOptionalParameter(parameterName, expectedType, loggingProperties?.nextIndent);
        if (value == null)
            throw httpsError("invalid-argument", `Couldn't parse '${parameterName}'. Expected type '${expectedType}', but got undefined or null.`, loggingProperties);
        return value;
    }
}
