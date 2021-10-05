import { httpsError } from "../utils";
import { LoggingProperties } from "./LoggingProperties";
import {ParameterContainer} from "./ParameterContainer";

/**
 * Importance of a fine
 */
export class Importance {

    /**
     * Value of importance.
     */
    readonly value: "high" | "medium" | "low";

    /**
     * Initializes importance with string value.
     * @param {"high" | "medium" | "low"} value Value of the importance.
     */
    private constructor(value: "high" | "medium" | "low") {
        this.value = value;
    }

    /**
     * Constructs importance from an string or throws a HttpsError if parsing failed.
     * @param {string} value Value of the importance.
     * @return {Importance} Parsed importance.
     */
    static fromString(value: string, loggingProperties?: LoggingProperties): Importance {
        loggingProperties?.append("Importance.fromString", {value: value});
        if (value == "high" || value == "medium" || value == "low")
            return new Importance(value);
        throw httpsError("invalid-argument", `Couldn't parse Importance, expected 'high', 'medium' or 'low', but got ${value} instead.`, loggingProperties?.nextIndent);
    }

    /**
     * Constructs importance from parameter of parameter container with specified parameter name
     * or throws a HttpsError if parsing failed.
     * @param {ParameterContainer} container Parameter container to get parameter from.
     * @param {string} parameterName Name of parameter from parameter container.
     * @return {Importance} Parsed importance.
     */
    static fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties?: LoggingProperties): Importance {
        loggingProperties?.append("Importance.fromParameterContainer", {container: container, parameterName: parameterName});
        return Importance.fromString(container.getParameter(parameterName, "string", loggingProperties?.nextIndent), loggingProperties?.nextIndent);
    }
}
