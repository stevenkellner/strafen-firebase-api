import {ParameterContainer} from "./ParameterContainer";
import {Amount} from "./Amount";
import {Importance} from "./Importance";
import {guid} from "./guid";
import * as admin from "firebase-admin";
import {ReasonTemplate} from "./ReasonTemplate";
import {httpsError, undefinedAsNull} from "../utils";
import { LoggingProperties } from "./LoggingProperties";

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
export class FineReasonCustom {

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

    get ["forStatistics"](): StatisticsFineReason {
        return new StatisticsFineReason(null, this.reason, this.amount, this.importance);
    }
}

interface FineReasonTemplateObject {
    reasonTemplateId: string;
}

interface FineReasonCustomObject {
    reason: string;
    amount: number;
    importance: string;
}

export type FineReasonObject = FineReasonTemplateObject | FineReasonCustomObject;

export interface StatisticsFineReasonObject {
    id: string | null;
    reason: string;
    amount: number;
    importance: string;
}

// Contains all properties of a fine reason in staistics
export class StatisticsFineReason {

    // Id of template reason, null if fine reason is custom
    readonly id: guid | null;

    // Reason message of the fine
    readonly reason: string;

    // Amount of the fine
    readonly amount: Amount;

    // Importance of the fine
    readonly importance: Importance;

    constructor(id: guid | null, reason: string, amount: Amount, importance: Importance) {
        this.id = id;
        this.reason = reason;
        this.amount = amount;
        this.importance = importance;
    }

    get ["object"](): StatisticsFineReasonObject {
        return {
            id: undefinedAsNull(this.id?.guidString),
            reason: this.reason,
            amount: this.amount.numberValue,
            importance: this.importance.value,
        };
    }
}

export class FineReason {

    readonly value: FineReasonTemplate | FineReasonCustom;

    private constructor(value: FineReasonTemplate | FineReasonCustom) {
        this.value = value;
    }

    static fromObject(object: any, loggingProperties?: LoggingProperties): FineReason {
        loggingProperties?.append("FineReason.fromObject", {object: object});

        // Check if object has reason template id
        if (typeof object.reasonTemplateId === "string")
            return new FineReason(new FineReasonTemplate(guid.fromString(object.reasonTemplateId, loggingProperties?.nextIndent)));

        // Check if object has reason, amount and importance
        if (typeof object.reason == "string" && typeof object.amount === "number" && typeof object.importance === "string")
            return new FineReason(new FineReasonCustom(object.reason, Amount.fromNumber(object.amount, loggingProperties?.nextIndent), Importance.fromString(object.importance, loggingProperties?.nextIndent)));

        throw httpsError("invalid-argument", `Couldn't parse fine reason, no fine reason with reason template id and no custom fine reason given, got instead: ${JSON.stringify(object)}`, loggingProperties?.nextIndent);
    }

    static fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties?: LoggingProperties): FineReason {
        loggingProperties?.append("FineReason.fromObject", {container: container, parameterName: parameterName});
        return FineReason.fromObject(container.getParameter(parameterName, "object", loggingProperties?.nextIndent), loggingProperties?.nextIndent);
    }

    get ["object"](): FineReasonObject {
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

    async forStatistics(clubPath: string, loggingProperties?: LoggingProperties): Promise<StatisticsFineReason> {
        loggingProperties?.append("FineReason.forStatistics", {clubPath: clubPath});
        if (this.value instanceof FineReasonCustom)
            return this.value.forStatistics;
        const reasonTemplateRef = admin.database().ref(`${clubPath}/reasonTemplates/${this.value.reasonTemplateId.guidString}`);
        const reasonTemplateSnapshot = await reasonTemplateRef.once("value");
        const reasonTemplate = ReasonTemplate.fromSnapshot(reasonTemplateSnapshot, loggingProperties?.nextIndent);
        return new StatisticsFineReason(reasonTemplate.id, reasonTemplate.reason, reasonTemplate.amount, reasonTemplate.importance);
    }
}
