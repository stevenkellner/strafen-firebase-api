/**
 * Property of result for success with value.
 */
class ResultValueProperty<T> {

    /**
     * Value of success property.
     */
     readonly value: T

     /**
     * Initializes property with value.
     * @param {T} val Value of success property.
     */
     constructor(val: T) {
         this.value = val;
     }
}

/**
 * Property of result for failure with error.
 */
class ResultErrorProperty<E extends Error> {

    /**
     * Error of failure property.
     */
    readonly error: E

    /**
     * Initializes property with error.
     * @param {E} err Error of failure property.
     */
    constructor(err: E) {
        this.error = err;
    }
}

/**
 * Result can be success with a value of failure with an error.
 */
export class Result<T, E extends Error> {

    /**
     * Property can success or failure property.
     */
    private property: ResultValueProperty<T> | ResultErrorProperty<E>;

    /**
     * Initializes result with success or failure property.
     * @param {ResultValueProperty<T> | ResultErrorProperty<E>} property Success or failure property.
     */
    private constructor(property: ResultValueProperty<T> | ResultErrorProperty<E>) {
        this.property = property;
    }

    /**
     * Constructs success result with value.
     * @param {T} val Value of success result.
     * @return {Result<T, E>} Success result.
     */
    static success<T, E extends Error>(val: T): Result<T, E> {
        return new Result(new ResultValueProperty(val));
    }

    /**
     * constructs success result with void value.
     * @return {Result<void, E>} Success result.
     */
    static voidSuccess<E extends Error>(): Result<void, E> {
        return Result.success((() => {})()); // eslint-disable-line @typescript-eslint/no-empty-function
    }

    /**
     * Constructs failure result with error.
     * @param {E} err Error of failure result.
     * @return {Result<T, E>} Failure result.
     */
    static failure<T, E extends Error>(err: E): Result<T, E> {
        return new Result(new ResultErrorProperty(err));
    }

    /**
     * Returns value if success result or throws error otherwise.
     * @return {T} Value of success result.
     */
    get(): T {
        if (this.property instanceof ResultValueProperty)
            return this.property.value;
        else
            throw this.property.error;
    }

    /**
     * Returns value if success result of null otherwise.
     * @return {T | null} Value if success result of null otherwise.
     */
    getValue(): T | null {
        if (this.property instanceof ResultValueProperty)
            return this.property.value;
        else
            return null;
    }

    /**
     * Maps value of success result to new value.
     * @param {function(val: T): T2} mapper Mapper to map value of success result.
     * @return {Result<T2, E>} Mapped result.
     */
    map<T2>(mapper: (val: T) => T2): Result<T2, E> {
        if (this.property instanceof ResultValueProperty)
            return Result.success(mapper(this.property.value));
        else
            return Result.failure(this.property.error);
    }

    /**
     * Maps error of failure result to new error.
     * @param {function(err: E): E2} mapper Mapper to map error of failure result.
     * @return {Result<T, E2>} Mapped result.
     */
    mapError<E2 extends Error>(mapper: (err: E) => E2): Result<T, E2> {
        if (this.property instanceof ResultValueProperty)
            return Result.success(this.property.value);
        else
            return Result.failure(mapper(this.property.error));
    }
}
