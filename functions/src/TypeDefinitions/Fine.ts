import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { ParameterContainer } from "./ParameterContainer";
import { guid} from "./guid";
import { FineReason, FineReasonObject, StatisticsFineReason, StatisticsFineReasonObject } from "./FineReason";
import { PrimitveDataSnapshot, UpdateProperties, UpdatePropertiesObject } from "../utils";
import { Person, PersonObject } from "./Person";
import { PayedState } from "./PayedState";

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

    public static fromObject(object: any): Fine {

        // Check if object is from type object
        if (typeof object !== "object")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse fine, expected type 'object', but bot ${object} from type '${typeof object}'`);

        // Check if id is string
        if (typeof object.id !== "string")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse fine parameter 'id', expected type string but got '${object.id}' from type ${typeof object.id}`);
        const id = guid.fromString(object.id);

        // Check if person id is string
        if (typeof object.personId !== "string")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse fine parameter 'personId', expected type string but got '${object.personId}' from type ${typeof object.personId}`);
        const personId = guid.fromString(object.personId);

        // Check if payed state is object
        if (typeof object.payedState !== "object")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse fine parameter 'payedState', expected type object but got '${object.payedState}' from type ${typeof object.payedState}`);
        const payedState = PayedState.fromObject(object.payedState);

        // Check if number is a positive number
        if (typeof object.number !== "number" || object.number < 0)
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse fine parameter 'number', expected positive number but got '${object.number}' from type ${typeof object.number}`);

        // Check if date is a positive number
        if (typeof object.date !== "number" || object.date < 0)
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse fine parameter 'date', expected positive number but got '${object.date}' from type ${typeof object.date}`);

        // Check if fine reason is object
        if (typeof object.fineReason !== "object")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse fine parameter 'fineReason', expected type object but got '${object.fineReason}' from type ${typeof object.fineReason}`);
        const fineReason = FineReason.fromObject(object.fineReason);

        // Check if update properties is object
        if (typeof object.updateProperties !== "object")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse fine parameter 'updateProperties', expected type object but got '${object.updateProperties}' from type ${typeof object.updateProperties}`);
        const updateProperties = UpdateProperties.fromObject(object.updateProperties);

        // Return fine
        return new Fine(id, personId, payedState, object.number, object.date, fineReason, updateProperties);
    }

    public static fromSnapshot(snapshot: PrimitveDataSnapshot): Fine {

        // Check if data exists in snapshot
        if (!snapshot.exists())
            throw new functions.https.HttpsError("invalid-argument", "Couldn't parse Fine since no data exists in snapshot.");

        // Get id
        const idString = snapshot.key;
        if (idString == null)
            throw new functions.https.HttpsError("invalid-argument", "Couldn't parse Fine since snapshot has an invalid key.");

        // Get data from snapshot
        const data = snapshot.val();
        if (typeof data !== "object")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse Fine from snapshot since data isn't an object: ${data}`);

        // Return fine
        return Fine.fromObject({
            id: idString,
            ...data,
        });
    }

    public static fromParameterContainer(container: ParameterContainer, parameterName: string): Fine {
        return Fine.fromObject(container.getParameter(parameterName, "object"));
    }

    public get ["serverObjectWithoutId"](): Fine.ServerObjectWithoutId {
        return Fine.ServerObjectWithoutId.fromFine(this);
    }

    public get ["serverObject"](): Fine.ServerObject {
        return Fine.ServerObject.fromFine(this);
    }

    public async forStatistics(clubPath: string): Promise<Fine.Statistic> {
        return await Fine.Statistic.fromFine(this, clubPath);
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

        public static async fromFine(fine: Fine, clubPath: string): Promise<Statistic> {

            // Get statistic person
            const personRef = admin.database().ref(`${clubPath}/persons/${fine.personId.guidString}`);
            const personSnapshot = await personRef.once("value");
            const person = Person.fromSnapshot(personSnapshot);

            // Get statistic fine reason
            const fineReason = await fine.fineReason.forStatistics(clubPath);

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
