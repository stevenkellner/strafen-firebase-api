/**
 * Property of result for success with value.
 */
class ResultValueProperty<T> {

    /**
     * Initializes property with value.
     * @param { T } value Value of success property.
     */
    constructor(public readonly value: T) { }
}

/**
 * Property of result for failure with error.
 */
class ResultErrorProperty<E> {

    /**
     * Initializes property with error.
     * @param { E } error Error of failure property.
     */
    constructor(public readonly error: E) {}
}

/**
 * Result can be success with a value of failure with an error.
 */
export class Result<T, E> {

    /**
     * Initializes result with success or failure property.
     * @param { ResultValueProperty<T> | ResultErrorProperty<E> } property Success or failure property.
     */
    private constructor(private readonly property: ResultValueProperty<T> | ResultErrorProperty<E>) {}

    /**
     * Constructs success result with value.
     * @param { T } value Value of success result.
     * @return { Result<T, E> } Success result.
     */
    static success<T, E>(value: T): Result<T, E> {
        return new Result(new ResultValueProperty(value));
    }

    /**
     * constructs success result with void value.
     * @return { Result<void, E> } Success result.
     */
    static voidSuccess<E>(): Result<void, E> {
        return Result.success((() => {})()); // eslint-disable-line @typescript-eslint/no-empty-function
    }

    /**
     * Constructs failure result with error.
     * @param { E } error Error of failure result.
     * @return { Result<T, E> } Failure result.
     */
    static failure<T, E>(error: E): Result<T, E> {
        return new Result(new ResultErrorProperty(error));
    }

    /**
     * Returns value if success result or throws error otherwise.
     * @return { T } Value of success result.
     */
    get(): T {
        if (this.property instanceof ResultValueProperty)
            return this.property.value;
        throw this.property.error;
    }

    /**
     * Returns value if success result or null otherwise.
     */
    get value(): T | null {
        if (this.property instanceof ResultValueProperty)
            return this.property.value;
        return null;
    }

    /**
     * Returns value if sucess result or error otherwise.
     */
    get valueOrError(): T | E {
        if (this.property instanceof ResultValueProperty)
            return this.property.value;
        return this.property.error;
    }

    /**
     * Maps value of success result to new value.
     * @param { function(val: T): T2 } mapper Mapper to map value of success result.
     * @return { Result<T2, E> } Mapped result.
     */
    map<T2>(mapper: (value: T) => T2): Result<T2, E> {
        if (this.property instanceof ResultValueProperty)
            return Result.success(mapper(this.property.value));
        return Result.failure(this.property.error);
    }

    /**
     * Maps error of failure result to new error.
     * @param { function(err: E): E2 } mapper Mapper to map error of failure result.
     * @return { Result<T, E2> } Mapped result.
     */
    mapError<E2>(mapper: (error: E) => E2): Result<T, E2> {
        if (this.property instanceof ResultValueProperty)
            return Result.success(this.property.value);
        return Result.failure(mapper(this.property.error));
    }
}
