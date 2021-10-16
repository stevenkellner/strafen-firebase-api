import { Importance } from "./Importance";
import { ParameterContainer } from "./ParameterContainer";
import { Amount } from "./Amount";
import { guid } from "./guid";
import { Deleted, httpsError, PrimitveDataSnapshot } from "../utils";
import { LoggingProperties } from "./LoggingProperties";


export class ReasonTemplate {

    public constructor(
        public readonly id: guid,
        public readonly reason: string,
        public readonly amount: Amount,
        public readonly importance: Importance
    ) {}

    get ["serverObjectWithoutId"](): ReasonTemplate.ServerObjectWithoutId {
        return {
            reason: this.reason,
            amount: this.amount.numberValue,
            importance: this.importance.value,
        };
    }

    get ["serverObject"](): ReasonTemplate.ServerObject {
        return {
            id: this.id.guidString,
            ...this.serverObjectWithoutId,
        };
    }
}

export namespace ReasonTemplate {

    export interface ServerObject {
        id: string;
        reason: string;
        amount: number;
        importance: string;
    }

    export interface ServerObjectWithoutId {
        reason: string;
        amount: number;
        importance: string;
    }

    export class Builder {

        public fromValue(value: any, loggingProperties: LoggingProperties): ReasonTemplate | Deleted<guid> {
            loggingProperties.append("ReasonTemplate.Builder.fromValue", {value: value});

            // Check if value is from type object
            if (typeof value !== "object")
                throw httpsError("invalid-argument", `Couldn't parse ReasonTemplate, expected type 'object', but bot ${value} from type '${typeof value}'`, loggingProperties);

            // Check if type of id is string
            if (typeof value.id !== "string")
                throw httpsError("invalid-argument", `Couldn't parse ReasonTemplate parameter 'id'. Expected type 'string', but got '${value.id}' from type '${typeof value.id}'.`, loggingProperties);
            const id = guid.fromString(value.id, loggingProperties.nextIndent);

            // Check if reason template is deleted
            if (typeof value.deleted === "boolean") {
                if (!value.deleted)
                    throw httpsError("invalid-argument", "Couldn't parse reason template, deleted argument was false.", loggingProperties);
                return new Deleted(id);
            }

            // Check if type of reason is string
            if (typeof value.reason !== "string")
                throw httpsError("invalid-argument", `Couldn't parse ReasonTemplate parameter 'reason'. Expected type 'string', but got '${value.reason}' from type '${typeof value.reason}'.`, loggingProperties);

            // Check if type of amount is number
            if (typeof value.amount !== "number")
                throw httpsError("invalid-argument", `Couldn't parse ReasonTemplate parameter 'amount'. Expected type 'number', but got '${value.amount}' from type '${typeof value.amount}'.`, loggingProperties);
            const amount = new Amount.Builder().fromValue(value.amount, loggingProperties.nextIndent);

            // Check if type of importance is string
            if (typeof value.importance !== "string")
                throw httpsError("invalid-argument", `Couldn't parse ReasonTemplate parameter 'importance'. Expected type 'string', but got '${value.importance}' from type '${typeof value.importance}'.`, loggingProperties);
            const importance = new Importance.Builder().fromValue(value.importance, loggingProperties.nextIndent);

            // Return reason template
            return new ReasonTemplate(id, value.reason, amount, importance);
        }

        public fromSnapshot(snapshot: PrimitveDataSnapshot, loggingProperties: LoggingProperties): ReasonTemplate | Deleted<guid> {
            loggingProperties.append("ReasonTemplate.Builder.fromSnapshot", {snapshot: snapshot});

            // Check if data exists in snapshot
            if (!snapshot.exists())
                throw httpsError("invalid-argument", "Couldn't parse ReasonTemplate since no data exists in snapshot.", loggingProperties);

            // Get id
            const idString = snapshot.key;
            if (idString == null)
                throw httpsError("invalid-argument", "Couldn't parse ReasonTemplate since snapshot has an invalid key.", loggingProperties);

            // Get data from snapshot
            const data = snapshot.val();
            if (typeof data !== "object")
                throw httpsError("invalid-argument", `Couldn't parse ReasonTemplate from snapshot since data isn't an object: ${data}`, loggingProperties);

            return this.fromValue({
                id: idString,
                ...data,
            }, loggingProperties.nextIndent);
        }

        public fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties: LoggingProperties): ReasonTemplate | Deleted<guid> {
            loggingProperties.append("ReasonTemplate.Builder.fromParameterContainer", {container: container, parameterName: parameterName});
            return this.fromValue(container.getParameter(parameterName, "object", loggingProperties.nextIndent), loggingProperties.nextIndent);
        }
    }
}
