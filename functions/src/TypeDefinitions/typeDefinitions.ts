import {Amount} from "./Amount";
import {FineReason} from "./FineReason";
import {Importance} from "./Importance";
import {PayedState} from "./PayedState";

// First and last name of a person
export interface PersonName {

    // First name
    first: string;

    // Last name (can be null)
    last: string | null;
}

// First and last name of a person
export interface OptionalPersonName {

    // First name
    first: string | null;

    // Last name (can be null)
    last: string | null;
}

// Contains all properties of a person
export interface Person {

    // Id of the person
    id: string;

    // Name of the person
    name: PersonName;
}

export interface PersonProperties {

    // Name of the person
    name: PersonName;

    signInData: {
        cashier: boolean;
        userId: string;
        signInDate: number;
    } | null;
}

// Contains all porperties of a fine in statistics
export interface FineProperties {

    // Id of associated person of the fine
    personId: string;

    // State of payement
    payed: PayedState;

    // Number of fines
    number: number;

    // Date when fine was created
    date: number;

    // Reason of fine
    reason: FineReason;
}

// Contains all properties of a fine in statistics
export interface StatisticsFine {

    // Id of the fine
    id: string;

    // Associated person of the fine
    person: Person;

    // State of payement
    payed: PayedState;

    // Number of fines
    number: number;

    // Date when fine was created
    date: number;

    // Reason of fine
    reason: StatisticsFineReason;
}

// Contains all properties of a fine reason in staistics
export interface StatisticsFineReason {

    // Id of template reason, null if fine reason is custom
    id?: string;

    // Reason message of the fine
    reason: string;

    // Amount of the fine
    amount: Amount;

    // Importance of the fine
    importance: Importance;
}

// Period of a time
export interface TimePeriod {

    // Value of the time period
    value: number;

    // Unit of the time period
    unit: "day" | "month" | "year";
}

// Late payement interest
export interface LatePaymentInterest {

    // Interest free timeinterval
    interestFreePeriod: TimePeriod;

    // Interest timeinterval
    interestPeriod: TimePeriod;

    // Rate of the interest
    interestRate: number;

    // Indicates whether compound interest is active
    compoundInterest: boolean;
}

export interface ClubProperties {
    identifier: string;
    name: string;
    regionCode: string;
    inAppPaymentActive: boolean;
    persons: {
        [key: string]: PersonProperties;
    };
    personUserIds: {
        [key: string]: string;
    };
}

// Contains all properties of a transaction
export interface TransactionProperties {

    // Indicates wheather the transaction is approved
    approved: boolean;

    // Ids of fines payed by the transaction
    fineIds: string[];

    // Name of the person payed the transaction
    name?: OptionalPersonName;

    // Date of the payment
    payDate: number;

    // Id of the person payed the transaction
    personId: string;

    // Id of the payout associated to the transaction
    payoutId: string | null;

}

// Contains all properties of a transaction in statistics
export interface StatisticsTransaction {

    // Id of the transaction
    id: string;

    // Indicates wheather the transaction is approved
    approved: boolean;

    // Ids of fines payed by the transaction
    fines: StatisticsFine[];

    // Name of the person payed the transaction
    name?: OptionalPersonName;

    // Date of the payment
    payDate: number;

    // Person payed the transaction
    person: Person;
}
