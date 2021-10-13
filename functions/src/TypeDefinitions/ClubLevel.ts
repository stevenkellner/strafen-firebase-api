import { httpsError } from "../utils";
import { LoggingProperties } from "./LoggingProperties";
import { ParameterContainer } from "./ParameterContainer";

/**
 * Club level of firebase function.
 */
export class ClubLevel {

    public constructor(
        public value: "regular" | "debug" | "testing"
    ) {}

    public get ["clubComponent"](): string {
        switch (this.value) {
        case "regular": return "clubs";
        case "debug": return "debugClubs";
        case "testing": return "testableClubs";
        }
    }
}

export namespace ClubLevel {
    export class Builder {
        public fromValue(value: any, loggingProperties: LoggingProperties): ClubLevel {
            loggingProperties.append("ClubLevel.Builder.fromString", {value: value});

            // Check if value is from type string
            if (typeof value !== "string")
                throw httpsError("invalid-argument", `Couldn't parse ClubLevel, expected type 'string', but bot ${value} from type '${typeof value}'`, loggingProperties);

            // Check if value is regular, debug or testing
            if (value !== "regular" && value !== "debug" && value !== "testing")
                throw httpsError("invalid-argument", `Couldn't parse ClubLevel, expected 'regular', 'debug' or 'testing', but got ${value} instead.`, loggingProperties);

            return new ClubLevel(value);
        }

        public fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties: LoggingProperties): ClubLevel {
            loggingProperties.append("ClubLevel.Builder.fromParameterContainer", {container: container, parameterName: parameterName});
            return this.fromValue(container.getParameter(parameterName, "string", loggingProperties.nextIndent), loggingProperties.nextIndent);
        }
    }
}
