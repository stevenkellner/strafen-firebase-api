import { HttpsError, type ILogger } from 'firebase-function';

export class Amount {
    public constructor(
        public readonly value: number,
        public readonly subUnitValue: number
    ) {}
}

export namespace Amount {
    export function fromNumber(value: number, logger: ILogger): Amount {
        logger.log('Amount.fromNumber', { value: value });
        if (value < 0)
            throw HttpsError('invalid-argument', 'Couldn\'t parse Amount since value is negative.', logger);
        const amountValue = Math.floor(value);
        const subUnitValue = (value * 100 - amountValue * 100);
        return new Amount(amountValue, Math.floor(subUnitValue));
    }

    export function description(amount: Amount): string {
        if (amount.subUnitValue === 0)
            return `${amount.value} €`;
        if (amount.subUnitValue <= 9)
            return `${amount.value}.0${amount.subUnitValue} €`;
        return `${amount.value}.${amount.subUnitValue} €`;
    }

    export type Flatten = number;

    export function flatten(amount: Amount): Amount.Flatten {
        return amount.value + amount.subUnitValue / 100;
    }

    export function concrete(amount: Amount.Flatten): Amount {
        const amountValue = Math.floor(amount);
        const subUnitValue = (amount * 100 - amountValue * 100);
        return new Amount(amountValue, Math.floor(subUnitValue));
    }
}
