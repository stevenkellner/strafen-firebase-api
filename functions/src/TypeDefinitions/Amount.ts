import {ParameterContainer} from "./ParameterContainer";
import * as functions from "firebase-functions";

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
    static fromNumber(amountValue: number): Amount {

        // Check if number is positiv
        if (amountValue < 0)
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse Amount since value is negative: ${amountValue}`);

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
    static fromParameterContainer(container: ParameterContainer, parameterName: string): Amount {
        return Amount.fromNumber(container.getParameter(parameterName, "number"));
    }

    get ["numberValue"](): number {
        return this.value + this.subUnitValue / 100;
    }
}
