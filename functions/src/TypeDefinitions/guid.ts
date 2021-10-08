import { httpsError } from "../utils";
import { LoggingProperties } from "./LoggingProperties";
import { ParameterContainer } from "./ParameterContainer";

/**
 * Represents a guid; used to generate a new guid.
 */
export class guid {

    /**
     * String value of the guid.
     */
    readonly guidString: string;

    /**
     * Initializes guid with a string.
     * @param {string} guidString String value of the guid.
     */
    private constructor(guidString: string) {
        this.guidString = guidString;
    }

    /**
     * Constructs guid from an string or throws a HttpsError if parsing failed.
     * @param {string} guidString String value of the guid.
     * @return {guid} Parsed guid.
     */
    static fromString(guidString: string, loggingProperties?: LoggingProperties): guid {
        loggingProperties?.append("guid.fromString", {guidString: guidString});
        const regex = new RegExp("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
        if (!regex.test(guidString))
            throw httpsError("invalid-argument", `Couldn't parse Guid, guid string isn't a valid Guid: ${guidString}`, loggingProperties);
        return new guid(guidString.toUpperCase());
    }

    /**
     * Constructs guid from parameter of parameter container with specified parameter name
     * or throws a HttpsError if parsing failed.
     * @param {ParameterContainer} container Parameter container to get parameter from.
     * @param {string} parameterName Name of parameter from parameter container.
     * @return {guid} Parsed guid.
     */
    static fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties?: LoggingProperties): guid {
        loggingProperties?.append("guid.fromParameterContainer", {container: container, parameterName: parameterName});
        return guid.fromString(container.getParameter(parameterName, "string", loggingProperties?.nextIndent), loggingProperties?.nextIndent);
    }

    /**
     * Generates a new guid.
     * @return {guid} Generated guid.
     */
    static newGuid(): guid {
        const guidString = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        return guid.fromString(guidString, undefined);
    }

    equals(other: guid): boolean {
        return this.guidString == other.guidString;
    }
}
