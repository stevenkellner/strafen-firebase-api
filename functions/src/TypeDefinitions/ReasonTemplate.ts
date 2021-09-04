import {Importance} from "./Importance";
import {ParameterContainer} from "./ParameterContainer";
import * as functions from "firebase-functions";
import {Amount} from "./Amount";
import {guid} from "./guid";

/**
 *  Contains all properties of a reason template
 */
export class ReasonTemplate {

    /**
     * Id of reason template
     */
    readonly id: guid;

    /**
     * Reason message of the reason template
     */
    readonly reason: string;

    /**
     * Amount of the reason template
     */
    readonly amount: Amount;

    /**
     * Importance of the reason template
     */
    readonly importance: Importance;

    private constructor(id: guid, reason: string, amount: Amount, importance: Importance) {
        this.id = id;
        this.reason = reason;
        this.amount = amount;
        this.importance = importance;
    }

    /**
     * Constructs ReasonTemplate from an object or throws a HttpsError if parsing failed.
     * @param {any} object Object to parse ReasonTemplate from.
     * @return {ReasonTemplate} Parsed ReasonTemplate from specified object.
     */
    static fromObject(object: any): ReasonTemplate {

        // Check if type of id is string
        if (typeof object.id !== "string")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse ReasonTemplate parameter 'id'. Expected type 'string', but got '${object.id}' from type '${typeof object.id}'.`);
        const id = guid.fromString(object.id);

        // Check if type of reason is string
        if (typeof object.reason !== "string")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse ReasonTemplate parameter 'reason'. Expected type 'string', but got '${object.reason}' from type '${typeof object.reason}'.`);

        // Check if type of amount is number
        if (typeof object.amount !== "number")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse ReasonTemplate parameter 'amount'. Expected type 'number', but got '${object.amount}' from type '${typeof object.amount}'.`);
        const amount = Amount.fromNumber(object.amount);

        // Check if type of importance is string
        if (typeof object.importance !== "string")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse ReasonTemplate parameter 'importance'. Expected type 'string', but got '${object.importance}' from type '${typeof object.importance}'.`);
        const importance = Importance.fromString(object.importance);

        // Return reason template
        return new ReasonTemplate(id, object.reason, amount, importance);
    }

    /**
     * Constructs ReasonTemplate from parameter of parameter container with specified parameter name
     * or throws a HttpsError if parsing failed.
     * @param {ParameterContainer} container Parameter container to get parameter from.
     * @param {string} parameterName Name of parameter from parameter container.
     * @return {ReasonTemplate} Parsed ReasonTemplate from specified parameter.
     */
    static fromParameterContainer(container: ParameterContainer, parameterName: string): ReasonTemplate {
        return ReasonTemplate.fromObject(container.getParameter(parameterName, "object"));
    }


    /**
     * Returns reason template as object without id.
     * @return {any} Reason template as object without id
     */
    toObjectWithoutId(): any {
        return {
            reason: this.reason,
            amount: this.amount.toNumber(),
            importance: this.importance.value,
        };
    }

    /**
     * Returns reason template as object.
     * @return {any} Reason template as object
     */
    toObject(): any {
        return {
            id: this.id,
            ...this.toObjectWithoutId(),
        };
    }
}
