import { httpsError } from '../utils';
import { Logger } from '../Logger';
import { ParameterContainer } from '../ParameterContainer';

/**
 * Represents a guid; used to generate a new guid.
 */
export class guid {

    /**
     * Initializes guid with a string.
     * @param { string } guidString String value of the guid.
     */
    public constructor(public readonly guidString: string) {}

    /**
     * Checks if this guid equals other guid.
     * @param { guid } other Other guid to check equality.
     * @return { boolean } `true` if this guid equals other guid, `false` otherwise.
     */
    equals(other: guid): boolean {
        return this.guidString == other.guidString;
    }
}

export namespace guid {

    /**
     * Constructs guid from an string or throws a HttpsError if parsing failed.
     * @param { string } value String value of the guid.
     * @param { Logger } logger Logger to log this method.
     * @return { guid } Parsed guid.
     */
    export function fromString(value: string, logger: Logger): guid {
        logger.append('guid.fromString', { value });
        const regex = new RegExp('^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$');
        if (!regex.test(value))
            throw httpsError(
                'invalid-argument',
                `Couldn't parse Guid, guid string isn't a valid Guid: ${value}`,
                logger
            );
        return new guid(value.toUpperCase());
    }

    /**
     * Constructs guid from an string or throws a HttpsError if parsing failed.
     * @param { any } value String value of the guid.
     * @param { Logger } logger Logger to log this method.
     * @return { guid } Parsed guid.
     */
    export function fromValue(value: any, logger: Logger): guid {
        logger.append('guid.fromValue', { value });

        // Check if value is from type string
        if (typeof value !== 'string')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse guid, expected type 'string', but bot ${value} from type '${typeof value}'`,
                logger
            );

        // Return guid.
        return guid.fromString(value, logger.nextIndent);
    }

    /**
     * Constructs guid from parameter of parameter container with specified parameter name
     * or throws a HttpsError if parsing failed.
     * @deprecated Use `container.parameter(parameterName, 'string', logger.nextIndent,
     * guid.fromObject)` instead.
     * @param { ParameterContainer } container Parameter container to get parameter from.
     * @param { string } parameterName Name of parameter from parameter container.
     * @param { Logger } logger Logger to log this method.
     * @return { guid } Builded guid.
     */
    export function fromParameterContainer(container: ParameterContainer, parameterName: string, logger: Logger): guid {
        logger.append('guid.fromParameterContainer', { container, parameterName });
        return guid.fromString(container.parameter(parameterName, 'string', logger.nextIndent), logger.nextIndent);
    }

    /**
     * Generates a new guid.
     * @return { guid } Generated guid.
     */
    export function newGuid(): guid {
        const guidString = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        const logger = Logger.start(new ParameterContainer({ verbose: true }), 'guid.newGuid');
        return guid.fromString(guidString, logger);
    }
}
