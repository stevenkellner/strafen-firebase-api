/* eslint-disable require-jsdoc */
import * as utf8 from 'utf8';

/**
 * Represents an utf-8 string with 16.
 */
export class UTF8WithLength16 {

    /**
     * String that is uft-8 encoded and has length 16.
     */
    public readonly rawString: string;

    public constructor(rawString: string) {
        if (utf8.encode(rawString) !== rawString)
            throw new UTF8.UTF8Error(UTF8.UTF8Error.Code.notUtf8);
        if (rawString.length != 16)
            throw new UTF8.UTF8Error(UTF8.UTF8Error.Code.notExpectedLength);
        this.rawString = rawString;
    }
}

/**
 * Represents an utf-8 string with 32.
 */
export class UTF8WithLength32 {

    /**
     * String that is uft-8 encoded and has length 32.
     */
    public readonly rawString: string;

    public constructor(rawString: string) {
        if (utf8.encode(rawString) !== rawString)
            throw new UTF8.UTF8Error(UTF8.UTF8Error.Code.notUtf8);
        if (rawString.length != 32)
            throw new UTF8.UTF8Error(UTF8.UTF8Error.Code.notExpectedLength);
        this.rawString = rawString;
    }
}

/**
 * Represents an utf-8 string with 64.
 */
export class UTF8WithLength64 {

    /**
     * String that is uft-8 encoded and has length 64.
     */
    public readonly rawString: string;

    public constructor(rawString: string) {
        if (utf8.encode(rawString) !== rawString)
            throw new UTF8.UTF8Error(UTF8.UTF8Error.Code.notUtf8);
        if (rawString.length != 64)
            throw new UTF8.UTF8Error(UTF8.UTF8Error.Code.notExpectedLength);
        this.rawString = rawString;
    }
}

export namespace UTF8 {

    /**
     * Errors thrown in initialization of UTF8
     */
    export class UTF8Error implements Error {

        public name = 'UTF8Error';

        public constructor(
            public readonly code: UTF8Error.Code
        ) {}

        public get ['message'](): string {
            return `${this.name}: ${this.code}`;
        }
    }

    export namespace UTF8Error {

        /**
         * Codes of errors thrown in initialization of UTF8
         */
        export enum Code {

            /**
             * Error thrown if raw string can not be utf-8 encoded.
             */
            notUtf8,

            /**
             * Error thrown if raw string hasn't expected length.
             */
            notExpectedLength
        }

    }
}
