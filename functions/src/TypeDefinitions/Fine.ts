import * as admin from "firebase-admin";
import { ParameterContainer } from "./ParameterContainer";
import { guid} from "./guid";
import { FineReason } from "./FineReason";
import { httpsError, PrimitveDataSnapshot } from "../utils";
import { Person } from "./Person";
import { PayedState } from "./PayedState";
import { LoggingProperties } from "./LoggingProperties";
import { getUpdatable, Updatable, UpdatableWithServerObject } from "./UpdateProperties";

export class Fine {

    public constructor(
        public readonly id: guid,
        public readonly personId: guid,
        public readonly payedState: UpdatableWithServerObject<PayedState>,
        public readonly number: number,
        public readonly date: number,
        public readonly fineReason: FineReason
    ) {}

    public get ["serverObjectWithoutId"](): Fine.ServerObjectWithoutId {
        return {
            personId: this.personId.guidString,
            payedState: this.payedState.serverObject,
            number: this.number,
            date: this.date,
            fineReason: this.fineReason.serverObject,
        };
    }

    public get ["serverObject"](): Fine.ServerObject {
        return {
            id: this.id.guidString,
            ...this.serverObjectWithoutId,
        };
    }

    public async forStatistics(clubPath: string, loggingProperties?: LoggingProperties): Promise<Fine.Statistic> {
        return await Fine.Statistic.fromFine(this, clubPath, loggingProperties?.nextIndent);
    }
}

export namespace Fine {

    export interface ServerObject {
        id: string,
        personId: string,
        payedState: Updatable<PayedState.ServerObject>,
        number: number,
        date: number,
        fineReason: FineReason.ServerObject
    }

    export interface ServerObjectWithoutId {
        personId: string,
        payedState: Updatable<PayedState.ServerObject>,
        number: number,
        date: number,
        fineReason: FineReason.ServerObject
    }

    export class Builder {
        public fromValue(value: any, loggingProperties?: LoggingProperties): Fine {
            loggingProperties?.append("Fine.Builder.fromValue", {value: value});

            // Check if value is from type object
            if (typeof value !== "object")
                throw httpsError("invalid-argument", `Couldn't parse fine, expected type 'object', but bot ${value} from type '${typeof value}'`, loggingProperties);

            // Check if id is string
            if (typeof value.id !== "string")
                throw httpsError("invalid-argument", `Couldn't parse fine parameter 'id', expected type string but got '${value.id}' from type ${typeof value.id}`, loggingProperties);
            const id = guid.fromString(value.id, loggingProperties?.nextIndent);

            // Check if person id is string
            if (typeof value.personId !== "string")
                throw httpsError("invalid-argument", `Couldn't parse fine parameter 'personId', expected type string but got '${value.personId}' from type ${typeof value.personId}`, loggingProperties);
            const personId = guid.fromString(value.personId, loggingProperties?.nextIndent);

            // Check if payed state is object
            if (typeof value.payedState !== "object")
                throw httpsError("invalid-argument", `Couldn't parse fine parameter 'payedState', expected type object but got '${value.payedState}' from type ${typeof value.payedState}`, loggingProperties);
            const payedState = getUpdatable<PayedState, PayedState.Builder>(value, new PayedState.Builder(), loggingProperties?.nextIndent);

            // Check if number is a positive number
            if (typeof value.number !== "number" || value.number < 0)
                throw httpsError("invalid-argument", `Couldn't parse fine parameter 'number', expected positive number but got '${value.number}' from type ${typeof value.number}`, loggingProperties);

            // Check if date is a positive number
            if (typeof value.date !== "number" || value.date < 0)
                throw httpsError("invalid-argument", `Couldn't parse fine parameter 'date', expected positive number but got '${value.date}' from type ${typeof value.date}`, loggingProperties);

            // Check if fine reason is object
            if (typeof value.fineReason !== "object")
                throw httpsError("invalid-argument", `Couldn't parse fine parameter 'fineReason', expected type object but got '${value.fineReason}' from type ${typeof value.fineReason}`, loggingProperties);
            const fineReason = new FineReason.Builder().fromValue(value.fineReason, loggingProperties?.nextIndent);

            // Return fine
            return new Fine(id, personId, payedState, value.number, value.date, fineReason);
        }

        public fromSnapshot(snapshot: PrimitveDataSnapshot, loggingProperties?: LoggingProperties): Fine {
            loggingProperties?.append("Fine.Builder.fromSnapshot", {snapshot: snapshot});

            // Check if data exists in snapshot
            if (!snapshot.exists())
                throw httpsError("invalid-argument", "Couldn't parse Fine since no data exists in snapshot.", loggingProperties);

            // Get id
            const idString = snapshot.key;
            if (idString == null)
                throw httpsError("invalid-argument", "Couldn't parse Fine since snapshot has an invalid key.", loggingProperties);

            // Get data from snapshot
            const data = snapshot.val();
            if (typeof data !== "object")
                throw httpsError("invalid-argument", `Couldn't parse Fine from snapshot since data isn't an object: ${data}`, loggingProperties);

            // Return fine
            return this.fromValue({
                id: idString,
                ...data,
            }, loggingProperties?.nextIndent);
        }

        public fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties?: LoggingProperties): Fine {
            loggingProperties?.append("Fine.Builder.fromParameterContainer", {container: container, parameterName: parameterName});
            return this.fromValue(container.getParameter(parameterName, "object", loggingProperties?.nextIndent), loggingProperties?.nextIndent);
        }
    }

    export class Statistic {

        private constructor(
            public readonly id: guid,
            public readonly person: Person,
            public readonly payedState: PayedState,
            public readonly number: number,
            public readonly date: number,
            public readonly fineReason: FineReason.Statistic
        ) {}

        public static async fromFine(fine: Fine, clubPath: string, loggingProperties?: LoggingProperties): Promise<Statistic> {
            loggingProperties?.append("Fine.Statistic.fromFine", {fine: fine, clubPath: clubPath});

            // Get statistic person
            const personRef = admin.database().ref(`${clubPath}/persons/${fine.personId.guidString}`);
            const personSnapshot = await personRef.once("value");
            const person = new Person.Builder().fromSnapshot(personSnapshot, loggingProperties?.nextIndent);

            // Get statistic fine reason
            const fineReason = await fine.fineReason.forStatistics(clubPath, loggingProperties?.nextIndent);

            // Return statistic
            return new Statistic(fine.id, person, fine.payedState.property, fine.number, fine.date, fineReason);
        }

        public get ["serverObject"](): Statistic.ServerObject {
            return {
                id: this.id.guidString,
                person: this.person.serverObject,
                payedState: this.payedState.serverObject,
                number: this.number,
                date: this.date,
                fineReason: this.fineReason.serverObject,
            };
        }
    }

    export namespace Statistic {

        export interface ServerObject {
            id: string,
            person: Person.ServerObject,
            payedState: PayedState.ServerObject,
            number: number,
            date: number,
            fineReason: FineReason.Statistic.ServerObject
        }
    }
}
