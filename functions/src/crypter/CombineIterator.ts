/**
 * Combines to iterators with an closure to combine both elements. If an iterator
 * has more elements than the other, these elements are droped.
 */
export class CombineIterator<T1, T2, R> implements Iterator<R, undefined> {

    /**
     * Initializes with two iterators and transformation closure.
     * @param { Iterator<T1> } iterator1 First iterator.
     * @param { Iterator<T2> } iterator2 Second iterator.
     * @param { function(element1: T1, element2: T2): R } combineElement Closure to combine elements of the iterators.
     */
    public constructor(
        private readonly iterator1: Iterator<T1>,
        private readonly iterator2: Iterator<T2>,
        private readonly combineElement: (element1: T1, element2: T2) => R
    ) {}

    /**
     * Get next result of the iterator.
     * @return { IteratorResult<R, undefined> } Next result of the iterator.
     */
    public next(): IteratorResult<R, undefined> {
        const element1 = this.iterator1.next();
        const element2 = this.iterator2.next();
        if ((element1.done ?? false) || (element2.done ?? false))
            return { done: true, value: undefined };
        return {
            value: this.combineElement(element1.value, element2.value),
        };
    }
}
