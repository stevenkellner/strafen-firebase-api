import {ParameterContainer} from "./ParameterContainer";
import * as functions from "firebase-functions";
import {PrimitveDataSnapshot} from "../utils";

/*
 * Period of a time
 */
class TimePeriod {

    /*
     * Value of the time period
     */
    readonly value: number;

    /*
     * Unit of the time period
     */
    readonly unit: "day" | "month" | "year";

    constructor(value: number, unit: "day" | "month" | "year") {
        this.value = value;
        this.unit = unit;
    }

    static fromObject(object: any): TimePeriod {

        // Check if type of value is number
        if (typeof object.value !== "number")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse TimePeriod parameter 'value'. Expected type 'number', but got '${object.value}' from type '${typeof object.value}'.`);

        // Check if type of unit is boolean
        if (typeof object.unit !== "string" || !(object.unit == "day" || object.unit == "month" || object.unit == "year"))
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse TimePeriod parameter 'unit'. Expected 'day', 'month' or 'year' from type 'string', but got '${object.unit}' from type '${typeof object.unit}'.`);

        // Return time period
        return new TimePeriod(object.value, object.unit);
    }
}

/*
 * Late payement interest
 */
export class LatePaymentInterest {

    /*
     * Interest free timeinterval
     */
    readonly interestFreePeriod: TimePeriod;

    /*
     * Interest timeinterval
     */
    readonly interestPeriod: TimePeriod;

    /*
     * Rate of the interest
     */
    readonly interestRate: number;

    /*
     * Indicates whether compound interest is active
     */
    readonly compoundInterest: boolean;

    constructor(interestFreePeriod: TimePeriod, interestPeriod: TimePeriod, interestRate: number, compoundInterest: boolean) {
        this.interestFreePeriod = interestFreePeriod;
        this.interestPeriod = interestPeriod;
        this.interestRate = interestRate;
        this.compoundInterest = compoundInterest;
    }

    static fromObject(object: any): LatePaymentInterest {

        // Check if type of interest free period is time period
        if (typeof object.interestFreePeriod !== "object")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse LatePaymentInterest parameter 'interestFreePeriod'. Expected type 'object', but got '${object.interestFreePeriod}' from type '${typeof object.interestFreePeriod}'.`);
        const interestFreePeriod = TimePeriod.fromObject(object.interestFreePeriod);

        // Check if type of interest period is time period
        if (typeof object.interestPeriod !== "object")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse LatePaymentInterest parameter 'interestPeriod'. Expected type 'object', but got '${object.interestPeriod}' from type '${typeof object.interestPeriod}'.`);
        const interestPeriod = TimePeriod.fromObject(object.interestPeriod);

        // Check if type of interest rate is number
        if (typeof object.interestRate !== "number")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse LatePaymentInterest parameter 'interestRate'. Expected type 'number', but got '${object.interestRate}' from type '${typeof object.interestRate}'.`);

        // Check if type of compound interest is boolean
        if (typeof object.compoundInterest !== "boolean")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse LatePaymentInterest parameter 'compoundInterest'. Expected type 'boolean', but got '${object.compoundInterest}' from type '${typeof object.compoundInterest}'.`);

        // Return late payment interest
        return new LatePaymentInterest(interestFreePeriod, interestPeriod, object.interestRate, object.compoundInterest);
    }

    static fromSnapshot(snapshot: PrimitveDataSnapshot): LatePaymentInterest {

        // Check if data exists in snapshot
        if (!snapshot.exists())
            throw new functions.https.HttpsError("invalid-argument", "Couldn't parse Person since no data exists in snapshot.");

        const data = snapshot.val();
        if (typeof data !== "object")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse Person from snapshot since data isn't an object: ${data}`);

        return LatePaymentInterest.fromObject(data);
    }

    static fromParameterContainer(container: ParameterContainer, parameterName: string): LatePaymentInterest {
        return LatePaymentInterest.fromObject(container.getParameter(parameterName, "object"));
    }
}
