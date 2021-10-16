import { ParameterContainer } from "./ParameterContainer";
import { Deleted, httpsError, PrimitveDataSnapshot } from "../utils";
import { LoggingProperties } from "./LoggingProperties";

/*
 * Late payement interest
 */
export class LatePaymentInterest {

    public constructor(
        public readonly interestFreePeriod: LatePaymentInterest.TimePeriod,
        public readonly interestPeriod: LatePaymentInterest.TimePeriod,
        public readonly interestRate: number,
        public readonly compoundInterest: boolean
    ) {}

    public get ["serverObject"](): LatePaymentInterest {
        return this;
    }
}

export namespace LatePaymentInterest {

    export class Builder {

        public fromValue(value: any, loggingProperties: LoggingProperties): LatePaymentInterest | Deleted<null> {
            loggingProperties.append("LatePaymentInterest.Builder.fromValue", {value: value});

            // Check if value is from type object
            if (typeof value !== "object")
                throw httpsError("invalid-argument", `Couldn't parse LatePaymentInterest, expected type 'object', but bot ${value} from type '${typeof value}'`, loggingProperties);

            // Check if interest is deleted
            if (typeof value.deleted === "boolean") {
                if (!value.deleted)
                    throw httpsError("invalid-argument", "Couldn't parse interest, deleted argument was false.", loggingProperties);
                return new Deleted(null);
            }

            // Check if type of interest free period is time period
            if (typeof value.interestFreePeriod !== "object")
                throw httpsError("invalid-argument", `Couldn't parse LatePaymentInterest parameter 'interestFreePeriod'. Expected type 'object', but got '${value.interestFreePeriod}' from type '${typeof value.interestFreePeriod}'.`, loggingProperties);
            const interestFreePeriod = new TimePeriod.Builder().fromValue(value.interestFreePeriod, loggingProperties.nextIndent);

            // Check if type of interest period is time period
            if (typeof value.interestPeriod !== "object")
                throw httpsError("invalid-argument", `Couldn't parse LatePaymentInterest parameter 'interestPeriod'. Expected type 'object', but got '${value.interestPeriod}' from type '${typeof value.interestPeriod}'.`, loggingProperties);
            const interestPeriod = new TimePeriod.Builder().fromValue(value.interestPeriod, loggingProperties.nextIndent);

            // Check if type of interest rate is number
            if (typeof value.interestRate !== "number")
                throw httpsError("invalid-argument", `Couldn't parse LatePaymentInterest parameter 'interestRate'. Expected type 'number', but got '${value.interestRate}' from type '${typeof value.interestRate}'.`, loggingProperties);

            // Check if type of compound interest is boolean
            if (typeof value.compoundInterest !== "boolean")
                throw httpsError("invalid-argument", `Couldn't parse LatePaymentInterest parameter 'compoundInterest'. Expected type 'boolean', but got '${value.compoundInterest}' from type '${typeof value.compoundInterest}'.`, loggingProperties);

            // Return late payment interest
            return new LatePaymentInterest(interestFreePeriod, interestPeriod, value.interestRate, value.compoundInterest);
        }

        public fromSnapshot(snapshot: PrimitveDataSnapshot, loggingProperties: LoggingProperties): LatePaymentInterest | Deleted<null> {
            loggingProperties.append("LatePaymentInterest.Builder.fromSnapshot", {osnapshotject: snapshot});

            // Check if data exists in snapshot
            if (!snapshot.exists())
                throw httpsError("invalid-argument", "Couldn't parse Person since no data exists in snapshot.", loggingProperties);

            const data = snapshot.val();
            if (typeof data !== "object")
                throw httpsError("invalid-argument", `Couldn't parse Person from snapshot since data isn't an object: ${data}`, loggingProperties);

            return this.fromValue(data, loggingProperties.nextIndent);
        }

        public fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties: LoggingProperties): LatePaymentInterest | Deleted<null> {
            loggingProperties.append("LatePaymentInterest.Builder.fromParameterContainer", {container: container, parameterName: parameterName});
            return this.fromValue(container.getParameter(parameterName, "object", loggingProperties.nextIndent), loggingProperties.nextIndent);
        }
    }

    export class TimePeriod {

        public constructor(
            public readonly value: number,
            public readonly unit: "day" | "month" | "year"
        ) {}
    }

    export namespace TimePeriod {
        export class Builder {

            public fromValue(value: any, loggingProperties: LoggingProperties): TimePeriod {
                loggingProperties.append("TimePeriod.fromValue", {value: value});

                // Check if value is from type object
                if (typeof value !== "object")
                    throw httpsError("invalid-argument", `Couldn't parse TimePeriod, expected type 'object', but bot ${value} from type '${typeof value}'`, loggingProperties);

                // Check if type of value is number
                if (typeof value.value !== "number")
                    throw httpsError("invalid-argument", `Couldn't parse TimePeriod parameter 'value'. Expected type 'number', but got '${value.value}' from type '${typeof value.value}'.`, loggingProperties);

                // Check if type of unit is boolean
                if (typeof value.unit !== "string" || !(value.unit == "day" || value.unit == "month" || value.unit == "year"))
                    throw httpsError("invalid-argument", `Couldn't parse TimePeriod parameter 'unit'. Expected 'day', 'month' or 'year' from type 'string', but got '${value.unit}' from type '${typeof value.unit}'.`, loggingProperties);

                // Return time period
                return new TimePeriod(value.value, value.unit);
            }
        }
    }
}
