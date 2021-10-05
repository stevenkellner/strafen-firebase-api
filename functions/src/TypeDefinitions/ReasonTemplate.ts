import {Importance} from "./Importance";
import {ParameterContainer} from "./ParameterContainer";
import {Amount} from "./Amount";
import {guid} from "./guid";
import {httpsError, PrimitveDataSnapshot} from "../utils";
import { LoggingProperties } from "./LoggingProperties";

export interface ReasonTemplateObject {
    id: string;
    reason: string;
    amount: number;
    importance: string;
}

interface ReasonTemplateObjectWithoutId {
    reason: string;
    amount: number;
    importance: string;
}

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
    static fromObject(object: any, loggingProperties?: LoggingProperties): ReasonTemplate {
        loggingProperties?.append("ReasonTemplate.fromObject", {object: object});

        // Check if type of id is string
        if (typeof object.id !== "string")
            throw httpsError("invalid-argument", `Couldn't parse ReasonTemplate parameter 'id'. Expected type 'string', but got '${object.id}' from type '${typeof object.id}'.`, loggingProperties?.nextIndent);
        const id = guid.fromString(object.id, loggingProperties?.nextIndent);

        // Check if type of reason is string
        if (typeof object.reason !== "string")
            throw httpsError("invalid-argument", `Couldn't parse ReasonTemplate parameter 'reason'. Expected type 'string', but got '${object.reason}' from type '${typeof object.reason}'.`, loggingProperties?.nextIndent);

        // Check if type of amount is number
        if (typeof object.amount !== "number")
            throw httpsError("invalid-argument", `Couldn't parse ReasonTemplate parameter 'amount'. Expected type 'number', but got '${object.amount}' from type '${typeof object.amount}'.`, loggingProperties?.nextIndent);
        const amount = Amount.fromNumber(object.amount, loggingProperties?.nextIndent);

        // Check if type of importance is string
        if (typeof object.importance !== "string")
            throw httpsError("invalid-argument", `Couldn't parse ReasonTemplate parameter 'importance'. Expected type 'string', but got '${object.importance}' from type '${typeof object.importance}'.`, loggingProperties?.nextIndent);
        const importance = Importance.fromString(object.importance, loggingProperties?.nextIndent);

        // Return reason template
        return new ReasonTemplate(id, object.reason, amount, importance);
    }

    static fromSnapshot(snapshot: PrimitveDataSnapshot, loggingProperties?: LoggingProperties): ReasonTemplate {
        loggingProperties?.append("ReasonTemplate.fromSnapshot", {snapshot: snapshot});

        // Check if data exists in snapshot
        if (!snapshot.exists())
            throw httpsError("invalid-argument", "Couldn't parse ReasonTemplate since no data exists in snapshot.", loggingProperties?.nextIndent);

        // Get id
        const idString = snapshot.key;
        if (idString == null)
            throw httpsError("invalid-argument", "Couldn't parse ReasonTemplate since snapshot has an invalid key.", loggingProperties?.nextIndent);

        const data = snapshot.val();
        if (typeof data !== "object")
            throw httpsError("invalid-argument", `Couldn't parse ReasonTemplate from snapshot since data isn't an object: ${data}`, loggingProperties?.nextIndent);

        return ReasonTemplate.fromObject({
            id: idString,
            ...data,
        }, loggingProperties?.nextIndent);
    }

    /**
     * Constructs ReasonTemplate from parameter of parameter container with specified parameter name
     * or throws a HttpsError if parsing failed.
     * @param {ParameterContainer} container Parameter container to get parameter from.
     * @param {string} parameterName Name of parameter from parameter container.
     * @return {ReasonTemplate} Parsed ReasonTemplate from specified parameter.
     */
    static fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties?: LoggingProperties): ReasonTemplate {
        loggingProperties?.append("ReasonTemplate.fromParameterContainer", {container: container, parameterName: parameterName});
        return ReasonTemplate.fromObject(container.getParameter(parameterName, "object", loggingProperties?.nextIndent), loggingProperties?.nextIndent);
    }


    /**
     * Returns reason template as object without id.
     * @return {any} Reason template as object without id
     */
    get ["objectWithoutId"](): ReasonTemplateObjectWithoutId {
        return {
            reason: this.reason,
            amount: this.amount.numberValue,
            importance: this.importance.value,
        };
    }

    /**
     * Returns reason template as object.
     * @return {any} Reason template as object
     */
    get ["object"](): ReasonTemplateObject {
        return {
            id: this.id.guidString,
            ...this.objectWithoutId,
        };
    }
}
