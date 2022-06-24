import { bits } from './utils';
/**
 * Iterator to convert an array of bytes to bits.
 */
export class BufferToBitIterator implements Iterator<0 | 1, undefined> {

    private bytesIterator: Iterator<number, undefined>;

    private currentBitsIterator: Iterator<0 | 1, undefined> | undefined;

    /**
     * Initializes iterator with array of bytes to convert to bits.
     * @param { Buffer } buffer Bytes to convert to bits.
     */
    public constructor(buffer: Buffer) {
        this.bytesIterator = buffer[Symbol.iterator]();
        const bytesIteratorResult = this.bytesIterator.next();
        if (!(bytesIteratorResult.done ?? false))
            this.currentBitsIterator = bits(bytesIteratorResult.value)[Symbol.iterator]();
    }

    /**
     * Get next result of the iterator.
     * @return { IteratorResult<0 | 1, undefined> } Next result of the iterator.
     */
    public next(): IteratorResult<0 | 1, undefined> {
        if (this.currentBitsIterator === undefined) return { done: true, value: undefined };
        const currentBitsIteratorResult = this.currentBitsIterator.next();
        if (!(currentBitsIteratorResult.done ?? false)) {
            return { value: currentBitsIteratorResult.value };
        }
        const bytesIteratorResult = this.bytesIterator.next();
        if (!(bytesIteratorResult.done ?? false))
            this.currentBitsIterator = bits(bytesIteratorResult.value)[Symbol.iterator]();
        else
            this.currentBitsIterator = undefined;
        return this.next();
    }
}
