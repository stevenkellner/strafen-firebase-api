import * as utf8 from 'utf8';

/**
 * Represents an utf-8 string with length 16.
 */
export class UTF8WithLength16 {

    /**
     * Initializes UTF8 with a string and checks if that string is uft-8 encoded and  has length 16.
     * @param { string } rawString String to check if is uft-8 encoded and has length 16.
     */
    public constructor(public readonly rawString: string) {
        if (utf8.encode(rawString) !== rawString)
            throw new UTF8WithLength.UTF8Error('Expected rawString to be utf-8.');
        if (rawString.length != 16)
            throw new UTF8WithLength.UTF8Error('Expected rawString to has length 16.');
        this.rawString = rawString;
    }
}

/**
 * Represents an utf-8 string with length 32.
 */
export class UTF8WithLength32 {

    /**
     * Initializes UTF8 with a string and checks if that string is uft-8 encoded and  has length 32.
     * @param { string } rawString String to check if is uft-8 encoded and has length 32.
     */
    public constructor(public readonly rawString: string) {
        if (utf8.encode(rawString) !== rawString)
            throw new UTF8WithLength.UTF8Error('Expected rawString to be utf-8.');
        if (rawString.length != 32)
            throw new UTF8WithLength.UTF8Error('Expected rawString to has length 32.');
        this.rawString = rawString;
    }
}

/**
 * Represents an utf-8 string with length 64.
 */
export class UTF8WithLength64 {

    /**
     * Initializes UTF8 with a string and checks if that string is uft-8 encoded and  has length 64.
     * @param { string } rawString String to check if is uft-8 encoded and has length 64.
     */
    public constructor(public readonly rawString: string) {
        if (utf8.encode(rawString) !== rawString)
            throw new UTF8WithLength.UTF8Error('Expected rawString to be utf-8.');
        if (rawString.length != 64)
            throw new UTF8WithLength.UTF8Error('Expected rawString to has length 64.');
        this.rawString = rawString;
    }
}

export namespace UTF8WithLength {

    /**
     * Errors thrown in initialization of UTF8.
     */
    export class UTF8Error implements Error {

        public readonly name = 'UTF8WithLength.Errors thrown in initialization of UTF8';

        /**
         * Constructs the error with specified message.
         * @param { string } message Message of the error.
         */
        public constructor(
            public readonly message: string
        ) {}
    }
}
