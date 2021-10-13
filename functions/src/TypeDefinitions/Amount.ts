import { ParameterContainer } from "./ParameterContainer";
import { httpsError } from "../utils";
import { LoggingProperties } from "./LoggingProperties";

export class Amount {

    public constructor(
        private value: number,
        private subUnitValue: number
    ) {}

    get ["numberValue"](): number {
        return this.value + this.subUnitValue / 100;
    }
}

export namespace Amount {
    export class Builder {
        public fromValue(value: any, loggingProperties: LoggingProperties): Amount {
            loggingProperties.append("Amount.Builder.fromValue", {value: value});

            // Check if value is from type number
            if (typeof value !== "number")
                throw httpsError("invalid-argument", `Couldn't parse amount, expected type 'number', but bot ${value} from type '${typeof value}'`, loggingProperties);

            // Check if number is positiv
            if (value < 0)
                throw httpsError("invalid-argument", "Couldn't parse Amount since value is negative.", loggingProperties);

            const amountValue = Math.floor(value);
            const subUnitValue = (value - amountValue) * 100;
            return new Amount(amountValue, Math.floor(subUnitValue));
        }

        public fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties: LoggingProperties): Amount {
            loggingProperties.append("Amount.Builder.fromParameterContainer", {container: container, parameterName: parameterName});
            return this.fromValue(container.getParameter(parameterName, "number", loggingProperties.nextIndent), loggingProperties.nextIndent);
        }
    }
}
