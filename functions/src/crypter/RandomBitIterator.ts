import { BufferToBitIterator } from './BufferToBitIterator';
import { PseudoRandom } from './PseudoRandom';

/**
 * Iterator to generate an endless steam of bits depending on specified seed.
 */
export class RandomBitIterator implements Iterator<0 | 1, undefined> {

    /**
     * Pseudo random number generator.
     */
    private pseudoRandom: PseudoRandom;

    /**
     * Iterator for bytes to bits
     */
    private bitIterator: Iterator<0 | 1>;

    /**
     * Initializes RandomBitIterator with a seed.
     * @param { string } seed Seed of the random bit iterator.
     */
    public constructor(seed: string) {
        this.pseudoRandom = new PseudoRandom(seed);
        this.bitIterator = new BufferToBitIterator(Buffer.from([this.pseudoRandom.randomByte()]));
    }

    /**
     * Get next result of the iterator.
     * @return { IteratorResult<0 | 1, undefined> } Next result of the iterator.
     */
    public next(): IteratorResult<0 | 1, undefined> {
        let bitResult = this.bitIterator.next();
        while (bitResult.done ?? false) {
            this.bitIterator = new BufferToBitIterator(Buffer.from([this.pseudoRandom.randomByte()]));
            bitResult = this.bitIterator.next();
        }
        return { value: bitResult.value };
    }
}
