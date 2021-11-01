import * as utf8 from "utf8";

export class UTF8WithLength16 {

    public readonly rawString: string;

    public constructor(rawString: string) {
        if (utf8.encode(rawString) !== rawString)
            throw new UTF8WithLength._Error("Expected rawString to be utf-8.");
        if (rawString.length != 16)
            throw new UTF8WithLength._Error("Expected rawString to has length 16.");
        this.rawString = rawString;
    }
}

export class UTF8WithLength32 {

    public readonly rawString: string;

    public constructor(rawString: string) {
        if (utf8.encode(rawString) !== rawString)
            throw new UTF8WithLength._Error("Expected rawString to be utf-8.");
        if (rawString.length != 32)
            throw new UTF8WithLength._Error("Expected rawString to has length 32.");
        this.rawString = rawString;
    }
}

export namespace UTF8WithLength {

    export class _Error implements Error {

        public readonly name = "UTF8WithLength._Error";

        public constructor(
            public readonly message: string
        ) {}
    }
}
