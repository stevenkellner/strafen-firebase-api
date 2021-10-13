import * as admin from "firebase-admin";
import { ParameterContainer } from "./ParameterContainer";
import { Amount } from "./Amount";
import { Importance } from "./Importance";
import { guid } from "./guid";
import { ReasonTemplate } from "./ReasonTemplate";
import { httpsError, undefinedAsNull } from "../utils";
import { LoggingProperties } from "./LoggingProperties";

export class FineReason {

    public constructor(
        public value: FineReason.WithTemplate | FineReason.WithCustom
    ) {}

    get ["serverObject"](): FineReason.ServerObject {
        if (this.value instanceof FineReason.WithTemplate)
            return {
                reasonTemplateId: this.value.reasonTemplateId.guidString,
            };
        return {
            reason: this.value.reason,
            amount: this.value.amount.numberValue,
            importance: this.value.importance.value,
        };
    }

    async forStatistics(clubPath: string, loggingProperties: LoggingProperties): Promise<FineReason.Statistic> {
        return await FineReason.Statistic.fromFineReason(this, clubPath, loggingProperties.nextIndent);
    }
}

export namespace FineReason {

    export class WithTemplate {

        public constructor(
            public reasonTemplateId: guid
        ) {}
    }

    export class WithCustom {

        constructor(
            public reason: string,
            public amount: Amount,
            public importance: Importance
        ) {}

        get ["forStatistics"](): Statistic {
            return new Statistic(null, this.reason, this.amount, this.importance);
        }
    }

    export class Builder {

        public fromValue(value: any, loggingProperties: LoggingProperties): FineReason {
            loggingProperties.append("FineReason.Builder.fromValue", {value: value});

            // Check if value is from type object
            if (typeof value !== "object")
                throw httpsError("invalid-argument", `Couldn't parse FineReason, expected type 'object', but bot ${value} from type '${typeof value}'`, loggingProperties);

            // Check if object has reason template id
            if (typeof value.reasonTemplateId === "string")
                return new FineReason(new FineReason.WithTemplate(guid.fromString(value.reasonTemplateId, loggingProperties.nextIndent)));

            // Check if object has reason, amount and importance
            if (typeof value.reason == "string" && typeof value.amount === "number" && typeof value.importance === "string")
                return new FineReason(new FineReason.WithCustom(value.reason, new Amount.Builder().fromValue(value.amount, loggingProperties.nextIndent), new Importance.Builder().fromValue(value.importance, loggingProperties.nextIndent)));

            throw httpsError("invalid-argument", `Couldn't parse fine reason, no fine reason with reason template id and no custom fine reason given, got instead: ${JSON.stringify(value)}`, loggingProperties);
        }

        public fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties: LoggingProperties): FineReason {
            loggingProperties.append("FineReason.Builder.fromObject", {container: container, parameterName: parameterName});
            return this.fromValue(container.getParameter(parameterName, "object", loggingProperties.nextIndent), loggingProperties.nextIndent);
        }

    }

    export type ServerObject = {
        reasonTemplateId: string;
    } | {
        reason: string;
        amount: number;
        importance: string;
    };

    export class Statistic {

        constructor(
            private readonly id: guid | null,
            private readonly reason: string,
            private readonly amount: Amount,
            private readonly importance: Importance
        ) {}

        public static async fromFineReason(fineReason: FineReason, clubPath: string, loggingProperties: LoggingProperties): Promise<Statistic> {
            loggingProperties.append("FineReason.Statistic.fromFineReason", {clubPath: clubPath});
            if (fineReason.value instanceof FineReason.WithCustom)
                return fineReason.value.forStatistics;
            const reasonTemplateRef = admin.database().ref(`${clubPath}/reasonTemplates/${fineReason.value.reasonTemplateId.guidString}`);
            const reasonTemplateSnapshot = await reasonTemplateRef.once("value");
            const reasonTemplate = new ReasonTemplate.Builder().fromSnapshot(reasonTemplateSnapshot, loggingProperties.nextIndent);
            if (!(reasonTemplate instanceof ReasonTemplate))
                throw httpsError("internal", "Couldn't get reasonTemplate for fine statistic.", loggingProperties);
            return new FineReason.Statistic(reasonTemplate.id, reasonTemplate.reason, reasonTemplate.amount, reasonTemplate.importance);
        }

        get ["serverObject"](): Statistic.ServerObject {
            return {
                id: undefinedAsNull(this.id?.guidString),
                reason: this.reason,
                amount: this.amount.numberValue,
                importance: this.importance.value,
            };
        }
    }

    export namespace Statistic {

        export interface ServerObject {
            id: string | null;
            reason: string;
            amount: number;
            importance: string;
        }
    }
}
