import { ParameterContainer } from "./ParameterContainer";
import { httpsError } from "../utils";
import { LoggingProperties } from "./LoggingProperties";

/**
 * Types of list item change
 */
export class ChangeType {

    public constructor(
        public value: "delete" | "update"
    ) {}
}

export namespace ChangeType {
    export class Builder {
        public fromValue(value: any, loggingProperties?: LoggingProperties): ChangeType {
            loggingProperties?.append("ChangeType.Builder.fromValue", {value: value});

            // Check if value is from type string
            if (typeof value !== "string")
                throw httpsError("invalid-argument", `Couldn't parse ChangeType, expected type 'string', but bot ${value} from type '${typeof value}'`, loggingProperties);

            // Check if value is delete or opdate
            if (value !== "delete" && value !== "update")
                throw httpsError("invalid-argument", `Couldn't parse ChangeType, expected 'delete' or 'update', but got ${value} instead.`, loggingProperties);

            return new ChangeType(value);
        }
        public fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties?: LoggingProperties): ChangeType {
            loggingProperties?.append("ChangeType.Builder.fromParameterContainer", {container: container, parameterName: parameterName});
            return this.fromValue(container.getParameter(parameterName, "string", loggingProperties?.nextIndent), loggingProperties?.nextIndent);
        }
    }
}
