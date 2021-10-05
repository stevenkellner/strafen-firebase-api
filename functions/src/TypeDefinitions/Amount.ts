import {ParameterContainer} from "./ParameterContainer";
import { httpsError } from "../utils";
import { LoggingProperties } from "./LoggingProperties";

export class Amount {

    private value: number;

    private subUnitValue: number;

    private constructor(value: number, subUnitValue: number) {
        this.value = value;
        this.subUnitValue = subUnitValue;
    }

    /**
     * Constructs Amount from an object or throws a HttpsError if parsing failed.
     * @param {any} amountValue Object to parse Amount from.
     * @return {Amount} Parsed Amount from specified object.
     */
    static fromNumber(amountValue: number, loggingProperties?: LoggingProperties): Amount {
        loggingProperties?.append("Amount.fromNumber", {amountValue: amountValue});

        // Check if number is positiv
        if (amountValue < 0)
            throw httpsError("invalid-argument", "Couldn't parse Amount since value is negative.", loggingProperties?.nextIndent);

        const value = Math.floor(amountValue);
        const subUnitValue = (amountValue - value) * 100;

        return new Amount(value, Math.floor(subUnitValue));
    }

    /**
     * Constructs Amount from parameter of parameter container with specified parameter name
     * or throws a HttpsError if parsing failed.
     * @param {ParameterContainer} container Parameter container to get parameter from.
     * @param {string} parameterName Name of parameter from parameter container.
     * @return {Amount} Parsed Amount from specified parameter.
     */
    static fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties?: LoggingProperties): Amount {
        loggingProperties?.append("Amount.fromParameterContainer", {container: container, parameterName: parameterName});
        return Amount.fromNumber(container.getParameter(parameterName, "number", loggingProperties?.nextIndent), loggingProperties?.nextIndent);
    }

    get ["numberValue"](): number {
        return this.value + this.subUnitValue / 100;
    }
}
