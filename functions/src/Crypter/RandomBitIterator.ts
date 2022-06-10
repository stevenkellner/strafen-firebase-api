/* eslint-disable require-jsdoc */
import { Bit, uint32ToBytes } from './BitAndByte';
import { BytesToBitIterator } from './BytesToBitIterator';
import { PseudoRandom } from './PseudoRandom';

/**
 * Iterator to generate an endless steam of bits depending on specified seed.
 */
export class RandomBitIterator implements Iterator<Bit, undefined, undefined> {

    /**
     * Pseudo random number generator
     */
    private pseudoRandom: PseudoRandom;

    /**
     * Iterator for bytes to bits
     */
    private bytesToBitsIterator: BytesToBitIterator;

    /**
     * Initializes RandomBitIterator with a seed
     * @param { string } seed Seed of the random bit iterator
     */
    public constructor(seed: string) {
        this.pseudoRandom = new PseudoRandom(seed);
        const bytes = uint32ToBytes(this.pseudoRandom.random() * 4294967296);
        this.bytesToBitsIterator = new BytesToBitIterator(bytes);
    }

    public next(): IteratorResult<Bit, undefined> {
        const bitResult = this.bytesToBitsIterator.next();
        if (bitResult.done ?? false) {
            const bytes = uint32ToBytes(this.pseudoRandom.random() * 4294967296);
            this.bytesToBitsIterator = new BytesToBitIterator(bytes);
            return this.next();
        }
        return {
            value: bitResult.value,
        };
    }
}
