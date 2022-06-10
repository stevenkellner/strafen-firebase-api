import { httpsError } from '../utils';
import { Logger } from '../Logger';
import { ParameterContainer } from '../ParameterContainer';

/**
 * Importance of a fine.
 * Valid importances: `high`, `medium`, `low`.
 */
export class Importance {

    /**
     * Constructs importance with raw value.
     * @param { 'high' | 'medium' | 'low' } value Raw value of the importance.
     */
    public constructor(public readonly value: 'high' | 'medium' | 'low') {}
}

export namespace Importance {

    /**
     * Builds importance from specified value.
     * @param { string } value Value to build importance from.
     * @param { Logger } logger Logger to log this method.
     * @return { Importance } Builded importance.
     */
    export function fromString(value: string, logger: Logger): Importance {
        logger.append('Importance.fromString', { value });

        // Check if value is high, medium or low.
        if (value !== 'high' && value !== 'medium' && value !== 'low')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse Importance, expected 'high', 'medium' or 'low', but got ${value} instead.`,
                logger
            );

        // Return importance.
        return new Importance(value);
    }

    /**
     * Builds importance from specified value.
     * @param { any } value Value to build importance from.
     * @param { Logger } logger Logger to log this method.
     * @return { Importance } Builded importance.
     */
    export function fromValue(value: any, logger: Logger): Importance {
        logger.append('Importance.fromValue', { value });

        // Check if value is from type string.
        if (typeof value !== 'string')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse Importance, expected type 'string', but bot ${value} from type '${typeof value}'`,
                logger
            );

        // Return importance.
        return Importance.fromString(value, logger.nextIndent);
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * @deprecated Use `container.parameter(parameterName, 'string', logger.nextIndent,
     * Importance.fromObject)` instead.
     */
    export function fromParameterContainer(
        container: ParameterContainer,
        parameterName: string,
        logger: Logger
    ): Importance {
        logger.append('Importance.fromParameterContainer', { container, parameterName });

        // Build and return importance.
        return Importance.fromValue(
            container.parameter(parameterName, 'string', logger.nextIndent),
            logger.nextIndent
        );
    }
}
