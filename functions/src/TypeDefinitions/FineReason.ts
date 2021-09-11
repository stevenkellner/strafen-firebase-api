import {ParameterContainer} from "./ParameterContainer";
import * as functions from "firebase-functions";
import {Amount} from "./Amount";
import {Importance} from "./Importance";
import {guid} from "./guid";
import {StatisticsFineReason} from "./typeDefinitions";

/**
 * Fine reason with template id
 */
export class FineReasonTemplate {

    /**
     * Id of template associated with fine reason
     */
    readonly reasonTemplateId: guid;

    constructor(reasonTemplateId: guid) {
        this.reasonTemplateId = reasonTemplateId;
    }
}

/**
 * Fine reason with reason message, amount and importance
 */
export class FineReasonCustom implements StatisticsFineReason {

    /**
     * Reason message of the fine
     */
    readonly reason: string;

    /**
     * Amount of the fine
     */
    readonly amount: Amount;

    /**
     * Importance of the fine
     */
    readonly importance: Importance;

    constructor(reason: string, amount: Amount, importance: Importance) {
        this.reason = reason;
        this.amount = amount;
        this.importance = importance;
    }
}

export class FineReason {

    readonly value: FineReasonTemplate | FineReasonCustom;

    private constructor(value: FineReasonTemplate | FineReasonCustom) {
        this.value = value;
    }

    static fromObject(object: { [key: string]: any }): FineReason {

        // Check if object has reason template id
        if (typeof object.reasonTemplateId === "string")
            return new FineReason(new FineReasonTemplate(guid.fromString(object.reasonTemplateId)));

        // Check if object has reason, amount and importance
        if (typeof object.reason == "string" && typeof object.amount === "number" && typeof object.importance === "string")
            return new FineReason(new FineReasonCustom(object.reason, Amount.fromNumber(object.amount), Importance.fromString(object.importance)));

        throw new functions.https.HttpsError("invalid-argument", `Couldn't parse fine reason, no fine reason with reason template id and no custom fine reason given, got instead: ${JSON.stringify(object)}`);
    }

    static fromParameterContainer(container: ParameterContainer, parameterName: string): FineReason {
        return FineReason.fromObject(container.getParameter(parameterName, "object"));
    }

    get ["object"](): { [key: string]: any } {
        if (this.value instanceof FineReasonTemplate)
            return {
                reasonTemplateId: this.value.reasonTemplateId.guidString,
            };
        return {
            reason: this.value.reason,
            amount: this.value.amount.numberValue,
            importance: this.value.importance.value,
        };
    }
}
