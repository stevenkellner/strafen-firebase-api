import * as functions from "firebase-functions";
import {undefinedAsNull} from "../utils";
import {ParameterContainer} from "./ParameterContainer";

/**
 * State of fine payment, can be payed, settled or unpayed. Contains extra properties
 * for pay date and in app payment if state is payed.
 */
export class PayedState {

    /**
     * State of the payment of the fine.
     */
    readonly state: "payed" | "settled" | "unpayed";

    /**
     * Pay date of the fine (provided if state is `payed`).
     */
    readonly payDate: number | null;

    /**
     * Indicates if the fine is payed in app (provided if state is `payed`).
     */
    readonly inApp: boolean | null;

    /**
     * Initializes PayedState with a state, optional pay date and in app payment.
     * @param {"payed" | "settled" | "unpayed"} state State of the payment of the fine.
     * @param {number | null} payDate Pay date of the fine (provided if state is `payed`).
     * @param {boolean | null} inApp Indicates if the fine is payed in app (provided if state is `payed`).
     */
    private constructor(state: "payed" | "settled" | "unpayed", payDate: number | null, inApp: boolean | null) {
        this.state = state;
        this.payDate = payDate;
        this.inApp = inApp;
    }

    /**
     * Constructs PayedState from an object or throws a HttpsError if parsing failed.
     * @param {any} object Object to parse PayedState from.
     * @return {PayedState} Parsed PayedState from specified object.
     */
    static fromObject(object: { [key: string]: any }): PayedState {

        // Check if type of state is a string and the value either 'payed', 'settled' or 'unpayed'.
        if (typeof object.state !== "string" || (object.state != "payed" && object.state != "settled" && object.state != "unpayed"))
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse PayedState parameter 'state'. Expected values 'payed', 'settled' or 'unpayed' from type 'string', but got '${object.state}' from type '${typeof object.state}'.`);

        // Check if type of payDate is undefined, null or number.
        if (typeof object.payDate !== "undefined" && object.payDate !== null && typeof object.payDate !== "number")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse PayedState parameter 'payDate'. Expected type 'number', undefined or null, but got '${object.payDate}' from type '${typeof object.payDate}'.`);

        // Check if type of inApp is undefined, null or boolean.
        if (typeof object.inApp !== "undefined" && object.inApp !== null && typeof object.inApp !== "boolean")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse PayedState parameter 'inApp'. Expected type 'boolean', undefined or null, but got '${object.payDate}' from type '${typeof object.payDate}'.`);

        // Check if payDate and inApp isn't null if state is 'payed'.
        if (object.state == "payed" && (object.payDate == null || object.inApp == null))
            throw new functions.https.HttpsError("invalid-argument", "Couldn't parse PayedState since state is 'payed' but payDate or inApp is null.");

        // Return payed state
        return new PayedState(object.state, undefinedAsNull(object.payDate), undefinedAsNull(object.inApp));
    }

    /**
     * Constructs PayedState from parameter of parameter container with specified parameter name
     * or throws a HttpsError if parsing failed.
     * @param {ParameterContainer} container Parameter container to get parameter from.
     * @param {string} parameterName Name of parameter from parameter container.
     * @return {PayedState} Parsed PayedState from specified parameter.
     */
    static fromParameterContainer(container: ParameterContainer, parameterName: string): PayedState {
        return PayedState.fromObject(container.getParameter(parameterName, "object"));
    }

    /**
     * Returns payed state as object.
     * @return {any} Payed state as object
     */
    get ["object"](): { [key: string]: any } {
        return {
            state: this.state,
            payDate: this.payDate,
            inApp: this.inApp,
        };
    }
}
