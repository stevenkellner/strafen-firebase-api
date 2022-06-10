import { ParameterContainer } from '../ParameterContainer';
import { httpsError } from '../utils';
import { Logger } from '../Logger';

/**
 * Types of list item change.
 * Valid change types: `delete` and `update`.
 */
export class ChangeType {

    /**
     * Cunstructs the change type from raw value.
     * @param { 'delete' | 'update' } value Raw value of the change type.
     */
    public constructor(public readonly value: 'delete' | 'update') {}
}

export namespace ChangeType {

    /**
     * Builds change type from specified value.
     * @param { string } value Value to build change type from.
     * @param { Logger } logger Logger to log this method.
     * @return { ChangeType } Builded change type.
     */
    export function fromString(value: string, logger: Logger): ChangeType {
        logger.append('ChangeType.fromString', { value });

        // Check if value is delete or opdate
        if (value !== 'delete' && value !== 'update')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse ChangeType, expected 'delete' or 'update', but got ${value} instead.`,
                logger
            );

        // Return change type.
        return new ChangeType(value);
    }

    /**
     * Builds change type from specified value.
     * @param { any } value Value to build change type from.
     * @param { Logger } logger Logger to log this method.
     * @return { ChangeType } Builded change type.
     */
    export function fromValue(value: any, logger: Logger): ChangeType {
        logger.append('ChangeType.fromValue', { value });

        // Check if value is from type string
        if (typeof value !== 'string')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse ChangeType, expected type 'string', but bot ${value} from type '${typeof value}'`,
                logger
            );

        // Return change type.
        return ChangeType.fromString(value, logger.nextIndent);
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * @deprecated Use `container.parameter(parameterName, 'string', logger.nextIndent,
     * ChangeType.fromString)` instead.
     */
    export function fromParameterContainer(
        container: ParameterContainer,
        parameterName: string,
        logger: Logger
    ): ChangeType {
        logger.append('ChangeType.fromParameterContainer', { container, parameterName });

        // Build and return change type.
        return ChangeType.fromValue(
            container.parameter(parameterName, 'string', logger.nextIndent),
            logger.nextIndent
        );
    }
}
