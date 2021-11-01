import { PseudoRandom } from "./PseudoRandom";

export class RandomBitIterator implements Iterator<0 | 1, undefined, undefined> {

    private pseudoRandom: PseudoRandom;

    private bitIterator: RandomBitIterator.BitIterator;

    public constructor(seed: string) {
        this.pseudoRandom = new PseudoRandom(seed);
        this.bitIterator = this.nextBitIterator();
    }

    private nextBitIterator(): RandomBitIterator.BitIterator {
        const value = this.pseudoRandom.random();
        let stringValue = value.toString().slice(2);
        while (stringValue.length > 16)
            stringValue = stringValue.slice(1);
        while (stringValue.length < 16)
            stringValue += "0";
        const byteIterator = new RandomBitIterator.ByteIterator(+stringValue);
        return new RandomBitIterator.BitIterator(byteIterator);
    }

    public next(): IteratorResult<0 | 1, undefined> {
        let bit = this.bitIterator.next().value;
        while (bit == undefined) {
            this.bitIterator = this.nextBitIterator();
            bit = this.bitIterator.next().value;
        }
        return {
            value: bit,
        };
    }
}

export namespace RandomBitIterator {
    export class ByteIterator implements Iterator<number, undefined, undefined> {

        private index = 0;

        public constructor(
            private number: number
        ) {}

        public next(): IteratorResult<number, undefined> {
            if (this.index == 6)
                return {
                    done: true,
                    value: undefined,
                };
            const byte = this.number & 0xff;
            this.number = (this.number - byte) / 256;
            this.index++;
            return {
                value: byte,
            };
        }
    }

    export class BitIterator implements Iterator<0 | 1, undefined, undefined> {

        private readonly byteIterator: ByteIterator;

        private currentByte: number | undefined;

        private index = 0;

        public constructor(byteIterator: ByteIterator) {
            this.byteIterator = byteIterator;
            this.currentByte = this.byteIterator.next().value;
        }

        public next(): IteratorResult<0 | 1, undefined> {
            if (this.index == 8) {
                this.currentByte = this.byteIterator.next().value;
                this.index = 0;
            }
            if (this.currentByte == undefined)
                return {
                    done: true,
                    value: undefined,
                };
            const bit = this.currentByte & 0x01;
            this.currentByte = (this.currentByte - bit) / 2;
            this.index++;
            return {
                value: bit == 0 ? 0 : 1,
            };
        }
    }
}

export class CombineIterator<T1, T2, R> implements Iterator<R, undefined, undefined> {

    public constructor(
        private readonly iterator1: Iterator<T1>,
        private readonly iterator2: Iterator<T2>,
        private readonly combineElement: (element1: T1, element2: T2) => R
    ) {}

    public next(): IteratorResult<R, undefined> {
        const element1 = this.iterator1.next();
        const element2 = this.iterator2.next();
        if ((element1.done ?? false) || (element2.done ?? false))
            return {
                done: true,
                value: undefined,
            };
        return {
            value: this.combineElement(element1.value, element2.value),
        };
    }
}
