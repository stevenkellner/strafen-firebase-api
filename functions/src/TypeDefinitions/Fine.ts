import {ParameterContainer} from "./ParameterContainer";
import * as functions from "firebase-functions";
import {PayedState, PayedStateObject} from "./PayedState";
import {guid} from "./guid";
import {FineReason, FineReasonObject, StatisticsFineReasonObject} from "./FineReason";
import {PrimitveDataSnapshot} from "../utils";
import {PersonObject} from "./Person";

export interface FineObject {
    id: string;
    personId: string;
    payedState: PayedStateObject;
    number: number;
    date: number;
    fineReason: FineReasonObject;
}

interface FineObjectWithoutId {
    personId: string;
    payedState: PayedStateObject;
    number: number;
    date: number;
    fineReason: FineReasonObject;
}

export interface StatisticsFineObject {
    id: string;
    person: PersonObject;
    payedState: PayedStateObject;
    number: number;
    date: number;
    fineReason: StatisticsFineReasonObject;
}

/**
 * Contains all porperties of a fine in statistics
 */
export class Fine {

    /**
     * Id of the fine
     */
    readonly id: guid;

    /**
     *  Id of associated person of the fine
     */
    readonly personId: guid;

    /**
     * State of payement
     */
    readonly payedState: PayedState;

    /**
     * Number of fines
     */
    readonly number: number;

    /**
     * Date when fine was created
     */
    readonly date: number;

    /**
     * Reason of fine
     */
    readonly fineReason: FineReason;

    private constructor(id: guid, personId: guid, payedState: PayedState, number: number, date: number, fineReason: FineReason) {
        this.id = id;
        this.personId = personId;
        this.payedState = payedState;
        this.number = number;
        this.date = date;
        this.fineReason = fineReason;
    }

    static fromObject(object: { [key: string]: any }): Fine {

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

        return new Fine(id, personId, payedState, object.number, object.date, fineReason);
    }

    static fromSnapshot(snapshot: PrimitveDataSnapshot): Fine {

        // Check if data exists in snapshot
        if (!snapshot.exists())
            throw new functions.https.HttpsError("invalid-argument", "Couldn't parse Fine since no data exists in snapshot.");

        // Get id
        const idString = snapshot.key;
        if (idString == null)
            throw new functions.https.HttpsError("invalid-argument", "Couldn't parse Fine since snapshot has an invalid key.");

        const data = snapshot.val();
        if (typeof data !== "object")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse Fine from snapshot since data isn't an object: ${data}`);

        return Fine.fromObject({
            id: idString,
            ...data,
        });
    }

    static fromParameterContainer(container: ParameterContainer, parameterName: string): Fine {
        return Fine.fromObject(container.getParameter(parameterName, "object"));
    }

    /**
     * Returns fine as object without id.
     * @return {FineObjectWithoutId} Fine as object without id
     */
    get ["objectWithoutId"](): FineObjectWithoutId {
        return {
            personId: this.personId.guidString,
            payedState: this.payedState.object,
            number: this.number,
            date: this.date,
            fineReason: this.fineReason.object,
        };
    }

    /**
     * Returns fine as object.
     * @return {FineObject} Fine as object
     */
    get ["object"](): FineObject {
        return {
            id: this.id.guidString,
            ...this.objectWithoutId,
        };
    }
}
