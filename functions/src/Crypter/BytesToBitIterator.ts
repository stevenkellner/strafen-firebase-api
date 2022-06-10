import { Bit, Byte } from "./BitAndByte";

/**
 * Iterator to convert an array of bytes to bits
 */
export class BytesToBitIterator implements Iterator<Bit, undefined, undefined> {

    /**
     * Iterator of array of bytes
     */
    private bytesIterator: Iterator<Byte>;

    /**
     * Current iterator of array of bits
     */
    private currentBitsIterator: Iterator<Bit> | undefined;

    /**
     * Initializes iterator with array of bytes to convert to bits
     * @param bytes Bytes to convert to bits
     */
    public constructor(bytes: Byte[]) {
        this.bytesIterator = bytes[Symbol.iterator]();
        const currentByteResult = this.bytesIterator.next();
        if (!(currentByteResult.done ?? false)) {
            this.currentBitsIterator = currentByteResult.value.bitList[Symbol.iterator]();
        }
    }

    public next(): IteratorResult<Bit, undefined> {
        if (this.currentBitsIterator == undefined) {
            return {
                done: true,
                value: undefined,
            };
        }
        const bitResult = this.currentBitsIterator.next();
        if (bitResult.done ?? false) {
            const currentByteResult = this.bytesIterator.next();
            if (!(currentByteResult.done ?? false)) {
                this.currentBitsIterator = currentByteResult.value.bitList[Symbol.iterator]();
            } else {
                this.currentBitsIterator = undefined;
            }
            return this.next();
        }
        return {
            value: bitResult.value,
        };
    }
}
