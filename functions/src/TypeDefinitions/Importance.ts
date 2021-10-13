import { httpsError } from "../utils";
import { LoggingProperties } from "./LoggingProperties";
import { ParameterContainer } from "./ParameterContainer";

/**
 * Importance of a fine
 */
export class Importance {

    public constructor(
        public readonly value: "high" | "medium" | "low"
    ) {}
}

export namespace Importance {
    export class Builder {

        public fromValue(value: any, loggingProperties: LoggingProperties): Importance {
            loggingProperties.append("Importance.Builder.fromValue", {value: value});

            // Check if value is from type string
            if (typeof value !== "string")
                throw httpsError("invalid-argument", `Couldn't parse Importance, expected type 'string', but bot ${value} from type '${typeof value}'`, loggingProperties);

            // Check if value is high, medium or low
            if (value !== "high" && value !== "medium" && value !== "low")
                throw httpsError("invalid-argument", `Couldn't parse Importance, expected 'high', 'medium' or 'low', but got ${value} instead.`, loggingProperties);

            return new Importance(value);
        }

        public fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties: LoggingProperties): Importance {
            loggingProperties.append("Importance.Builder.fromParameterContainer", {container: container, parameterName: parameterName});
            return this.fromValue(container.getParameter(parameterName, "string", loggingProperties.nextIndent), loggingProperties.nextIndent);
        }
    }
}
