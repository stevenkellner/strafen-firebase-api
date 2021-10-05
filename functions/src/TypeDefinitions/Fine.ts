import * as admin from "firebase-admin";
import { ParameterContainer } from "./ParameterContainer";
import { guid} from "./guid";
import { FineReason, FineReasonObject, StatisticsFineReason, StatisticsFineReasonObject } from "./FineReason";
import { httpsError, PrimitveDataSnapshot, UpdateProperties, UpdatePropertiesObject } from "../utils";
import { Person, PersonObject } from "./Person";
import { PayedState } from "./PayedState";
import { LoggingProperties } from "./LoggingProperties";

export class Fine {

    private constructor(
        public readonly id: guid,
        public readonly personId: guid,
        public readonly payedState: PayedState,
        public readonly number: number,
        public readonly date: number,
        public readonly fineReason: FineReason,
        public readonly updateProperties: UpdateProperties
    ) {}

    public static fromObject(object: any, loggingProperties?: LoggingProperties): Fine {
        loggingProperties?.append("Fine.fromObject", {object: object});

        // Check if object is from type object
        if (typeof object !== "object")
            throw httpsError("invalid-argument", `Couldn't parse fine, expected type 'object', but bot ${object} from type '${typeof object}'`, loggingProperties?.nextIndent);

        // Check if id is string
        if (typeof object.id !== "string")
            throw httpsError("invalid-argument", `Couldn't parse fine parameter 'id', expected type string but got '${object.id}' from type ${typeof object.id}`, loggingProperties?.nextIndent);
        const id = guid.fromString(object.id, loggingProperties?.nextIndent);

        // Check if person id is string
        if (typeof object.personId !== "string")
            throw httpsError("invalid-argument", `Couldn't parse fine parameter 'personId', expected type string but got '${object.personId}' from type ${typeof object.personId}`, loggingProperties?.nextIndent);
        const personId = guid.fromString(object.personId, loggingProperties?.nextIndent);

        // Check if payed state is object
        if (typeof object.payedState !== "object")
            throw httpsError("invalid-argument", `Couldn't parse fine parameter 'payedState', expected type object but got '${object.payedState}' from type ${typeof object.payedState}`, loggingProperties?.nextIndent);
        const payedState = PayedState.fromObject(object.payedState, loggingProperties?.nextIndent);

        // Check if number is a positive number
        if (typeof object.number !== "number" || object.number < 0)
            throw httpsError("invalid-argument", `Couldn't parse fine parameter 'number', expected positive number but got '${object.number}' from type ${typeof object.number}`, loggingProperties?.nextIndent);

        // Check if date is a positive number
        if (typeof object.date !== "number" || object.date < 0)
            throw httpsError("invalid-argument", `Couldn't parse fine parameter 'date', expected positive number but got '${object.date}' from type ${typeof object.date}`, loggingProperties?.nextIndent);

        // Check if fine reason is object
        if (typeof object.fineReason !== "object")
            throw httpsError("invalid-argument", `Couldn't parse fine parameter 'fineReason', expected type object but got '${object.fineReason}' from type ${typeof object.fineReason}`, loggingProperties?.nextIndent);
        const fineReason = FineReason.fromObject(object.fineReason, loggingProperties?.nextIndent);

        // Check if update properties is object
        if (typeof object.updateProperties !== "object")
            throw httpsError("invalid-argument", `Couldn't parse fine parameter 'updateProperties', expected type object but got '${object.updateProperties}' from type ${typeof object.updateProperties}`, loggingProperties?.nextIndent);
        const updateProperties = UpdateProperties.fromObject(object.updateProperties, loggingProperties?.nextIndent);

        // Return fine
        return new Fine(id, personId, payedState, object.number, object.date, fineReason, updateProperties);
    }

    public static fromSnapshot(snapshot: PrimitveDataSnapshot, loggingProperties?: LoggingProperties): Fine {
        loggingProperties?.append("Fine.fromSnapshot", {snapshot: snapshot});

        // Check if data exists in snapshot
        if (!snapshot.exists())
            throw httpsError("invalid-argument", "Couldn't parse Fine since no data exists in snapshot.", loggingProperties?.nextIndent);

        // Get id
        const idString = snapshot.key;
        if (idString == null)
            throw httpsError("invalid-argument", "Couldn't parse Fine since snapshot has an invalid key.", loggingProperties?.nextIndent);

        // Get data from snapshot
        const data = snapshot.val();
        if (typeof data !== "object")
            throw httpsError("invalid-argument", `Couldn't parse Fine from snapshot since data isn't an object: ${data}`, loggingProperties?.nextIndent);

        // Return fine
        return Fine.fromObject({
            id: idString,
            ...data,
        }, loggingProperties?.nextIndent);
    }

    public static fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties?: LoggingProperties): Fine {
        loggingProperties?.append("Fine.fromParameterContainer", {container: container, parameterName: parameterName});
        return Fine.fromObject(container.getParameter(parameterName, "object", loggingProperties?.nextIndent), loggingProperties?.nextIndent);
    }

    public get ["serverObjectWithoutId"](): Fine.ServerObjectWithoutId {
        return Fine.ServerObjectWithoutId.fromFine(this);
    }

    public get ["serverObject"](): Fine.ServerObject {
        return Fine.ServerObject.fromFine(this);
    }

    public async forStatistics(clubPath: string, loggingProperties?: LoggingProperties): Promise<Fine.Statistic> {
        return await Fine.Statistic.fromFine(this, clubPath, loggingProperties?.nextIndent);
    }
}

export namespace Fine {

    export class ServerObject {

        private constructor(
            public readonly id: string,
            public readonly personId: string,
            public readonly payedState: PayedState.ServerObject,
            public readonly number: number,
            public readonly date: number,
            public readonly fineReason: FineReasonObject,
            public readonly updateProperties: UpdatePropertiesObject
        ) {}

        public static fromFine(fine: Fine): ServerObject {
            return new ServerObject(fine.id.guidString, fine.personId.guidString, fine.payedState.serverObject, fine.number, fine.date, fine.fineReason.object, fine.updateProperties.object);
        }
    }

    export class ServerObjectWithoutId {

        private constructor(
            public readonly personId: string,
            public readonly payedState: PayedState.ServerObject,
            public readonly number: number,
            public readonly date: number,
            public readonly fineReason: FineReasonObject,
            public readonly updateProperties: UpdatePropertiesObject
        ) {}

        public static fromFine(fine: Fine): ServerObjectWithoutId {
            return new ServerObjectWithoutId(fine.personId.guidString, fine.payedState.serverObject, fine.number, fine.date, fine.fineReason.object, fine.updateProperties.object);
        }
    }

    export class Statistic {

        private constructor(
            public readonly id: guid,
            public readonly person: Person,
            public readonly payedState: PayedState,
            public readonly number: number,
            public readonly date: number,
            public readonly fineReason: StatisticsFineReason
        ) {}

        public static async fromFine(fine: Fine, clubPath: string, loggingProperties?: LoggingProperties): Promise<Statistic> {
            loggingProperties?.append("Fine.Statistic.fromFine", {fine: fine, clubPath: clubPath});

            // Get statistic person
            const personRef = admin.database().ref(`${clubPath}/persons/${fine.personId.guidString}`);
            const personSnapshot = await personRef.once("value");
            const person = Person.fromSnapshot(personSnapshot, loggingProperties?.nextIndent);

            // Get statistic fine reason
            const fineReason = await fine.fineReason.forStatistics(clubPath, loggingProperties?.nextIndent);

            // Return statistic
            return new Statistic(fine.id, person, fine.payedState, fine.number, fine.date, fineReason);
        }

        public get ["serverObject"](): Statistic.ServerObject {
            return Statistic.ServerObject.fromStatistic(this);
        }
    }

    export namespace Statistic {

        export class ServerObject {

            private constructor(
                public readonly id: string,
                public readonly person: PersonObject,
                public readonly payedState: PayedState.ServerObjectWithoutUpdateProperties,
                public readonly number: number,
                public readonly date: number,
                public readonly fineReason: StatisticsFineReasonObject,
            ) {}

            public static fromStatistic(statistic: Statistic): ServerObject {
                return new ServerObject(statistic.id.guidString, statistic.person.object, statistic.payedState.serverObjectWithoutUpdateProperties, statistic.number, statistic.date, statistic.fineReason.object);
            }
        }
    }
}
