import { v4 as uuidv4 } from 'uuid';
import { HttpsError, type ILogger } from 'firebase-function';

export class Guid {
    public constructor(
        public readonly guidString: string
    ) {}
}

export namespace Guid {
    export function fromString(value: string, logger: ILogger): Guid {
        logger.log('guid.fromString', { value: value });
        const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!regex.test(value))
            throw HttpsError('internal', `Couldn't parse Guid, guid string isn't a valid Guid: ${value}`, logger);
        return new Guid(value.toUpperCase());
    }

    export function newGuid(): Guid {
        return new Guid(uuidv4().toUpperCase());
    }
}
