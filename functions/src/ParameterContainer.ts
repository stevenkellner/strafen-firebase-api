import { httpsError } from './utils';
import { Logger } from './Logger';

/**
 * All valid parameter types: string, number, bigint, boolean, symbol, undefined or object.
 */
type ValidParameterTypes = 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object';

/**
 * Contains all parameters hand over by a firebase function.
 */
export class ParameterContainer {

    /**
     * Initializes parameter container with the data from a firebase function.
     * @param { any } data Data from firebase funtion to get parameters from.
     */
    public constructor(private data: any) {}

    public optionalParameter(
        parameterName: PropertyKey,
        expectedType: 'string',
        logger: Logger
    ): string | undefined;
    public optionalParameter<T>(
        parameterName: PropertyKey,
        expectedType: 'string',
        logger: Logger,
        builder: (rawParameter: string, logger: Logger) => T
    ): T | undefined;
    public optionalParameter(
        parameterName: PropertyKey,
        expectedType: 'number',
        logger: Logger
    ): number | undefined;
    public optionalParameter<T>(
        parameterName: PropertyKey,
        expectedType: 'number',
        logger: Logger,
        builder: (rawParameter: number, logger: Logger) => T
    ): T | undefined;
    public optionalParameter(
        parameterName: PropertyKey,
        expectedType: 'bigint',
        logger: Logger
    ): bigint | undefined;
    public optionalParameter<T>(
        parameterName: PropertyKey,
        expectedType: 'bigint',
        logger: Logger,
        builder: (rawParameter: bigint, logger: Logger) => T
    ): T | undefined;
    public optionalParameter(
        parameterName: PropertyKey,
        expectedType: 'boolean',
        logger: Logger
    ): boolean | undefined;
    public optionalParameter<T>(
        parameterName: PropertyKey,
        expectedType: 'boolean',
        logger: Logger,
        builder: (rawParameter: boolean, logger: Logger) => T
    ): T | undefined;
    public optionalParameter(
        parameterName: PropertyKey,
        expectedType: 'symbol',
        logger: Logger
    ): symbol | undefined;
    public optionalParameter<T>(
        parameterName: PropertyKey,
        expectedType: 'symbol',
        logger: Logger,
        builder: (rawParameter: symbol, logger: Logger) => T
    ): T | undefined;
    public optionalParameter(
        parameterName: PropertyKey,
        expectedType: 'undefined',
        logger: Logger
    ): undefined;
    public optionalParameter<T>(
        parameterName: PropertyKey,
        expectedType: 'undefined',
        logger: Logger,
        builder: (rawParameter: undefined, logger: Logger) => T
    ): T | undefined;
    public optionalParameter(
        parameterName: PropertyKey,
        expectedType: 'object',
        logger: Logger
    ): object | undefined;
    public optionalParameter<T>(
        parameterName: PropertyKey,
        expectedType: 'object',
        logger: Logger,
        builder: (rawParameter: object, logger: Logger) => T
    ): T | undefined;
    public optionalParameter(
        parameterName: PropertyKey,
        expectedType: ValidParameterTypes,
        logger: Logger
    ): any | undefined;
    public optionalParameter<T>(
        parameterName: PropertyKey,
        expectedType: ValidParameterTypes,
        logger: Logger,
        builder: (rawParameter: any, logger: Logger) => T
    ): T | undefined;
    public optionalParameter<T>(
        parameterName: PropertyKey,
        expectedType: ValidParameterTypes,
        logger: Logger,
        builder?: (rawParameter: any, logger: Logger) => T
    ): any | T | undefined;
    /**
     * Returns parameter with specified name and expected type or null if parameter is null or undefined.
     * @param { PropertyKey} parameterName Name of parameter to get.
     * @param { ValidParameterTypes } expectedType Expected type of the parameter.
     * @param { Logger } logger Logger to log this method.
     * @param { function(rawParameter: any, logger: Logger): any } builder Optional builder to build another type
     * from the raw parameter.
     * @return { any | undefined } Parameter hand over by firebase function with specified name
     * or undefined if parameter doesn't exists.
     */
    public optionalParameter(
        parameterName: PropertyKey,
        expectedType: ValidParameterTypes,
        logger: Logger,
        builder?: (rawParameter: any, logger: Logger) => any,
    ): any | undefined {
        logger.append('ParameterContainer.optionalParameter', { parameterName, expectedType });

        // Check if data is hand over by the firebase function.
        if (this.data === undefined || this.data === null)
            throw httpsError(
                'invalid-argument',
                `Couldn't parse '${parameterName.toString()}'. No parameters hand over by the firebase function.`,
                logger
            );

        // Return undefined if the parameter doesn't exist.
        if (!this.data.hasOwnProperty(parameterName))
            return undefined;

        // Get the parameter from the firebase function data.
        const parameter = this.data[parameterName];

        // Return undefined if the parameter is undefined or null.
        if (parameter === undefined || parameter === null)
            return undefined;

        // Check if the parameter has specified expected type.
        if (typeof parameter !== expectedType)
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse '${parameterName.toString()}'. Expected type '${expectedType}', but got '${parameter}' from type '${typeof parameter}' instead.`,
                logger
            );

        // Build the return type if a builder is specified.
        if (builder !== undefined)
            return builder(parameter, logger.nextIndent);

        // Return the parameter.
        return parameter;
    }

    public parameter(
        parameterName: PropertyKey,
        expectedType: 'string',
        logger: Logger
    ): string;
    public parameter<T>(
        parameterName: PropertyKey,
        expectedType: 'string',
        logger: Logger,
        builder: (rawParameter: string, logger: Logger) => T
    ): T;
    public parameter(
        parameterName: PropertyKey,
        expectedType: 'number',
        logger: Logger
    ): number;
    public parameter<T>(
        parameterName: PropertyKey,
        expectedType: 'number',
        logger: Logger,
        builder: (rawParameter: number, logger: Logger) => T
    ): T;
    public parameter(
        parameterName: PropertyKey,
        expectedType: 'bigint',
        logger: Logger
    ): bigint;
    public parameter<T>(
        parameterName: PropertyKey,
        expectedType: 'bigint',
        logger: Logger,
        builder: (rawParameter: bigint, logger: Logger) => T
    ): T;
    public parameter(
        parameterName: PropertyKey,
        expectedType: 'boolean',
        logger: Logger
    ): boolean;
    public parameter<T>(
        parameterName: PropertyKey,
        expectedType: 'boolean',
        logger: Logger,
        builder: (rawParameter: boolean, logger: Logger) => T
    ): T;
    public parameter(
        parameterName: PropertyKey,
        expectedType: 'symbol',
        logger: Logger
    ): symbol;
    public parameter<T>(
        parameterName: PropertyKey,
        expectedType: 'symbol',
        logger: Logger,
        builder: (rawParameter: symbol, logger: Logger) => T
    ): T;
    public parameter(
        parameterName: PropertyKey,
        expectedType: 'undefined',
        logger: Logger
    ): undefined;
    public parameter<T>(
        parameterName: PropertyKey,
        expectedType: 'undefined',
        logger: Logger,
        builder: (rawParameter: undefined, logger: Logger) => T
    ): T;
    public parameter(
        parameterName: PropertyKey,
        expectedType: 'object',
        logger: Logger
    ): object;
    public parameter<T>(
        parameterName: PropertyKey,
        expectedType: 'object',
        logger: Logger,
        builder: (rawParameter: object, logger: Logger) => T
    ): T;
    public parameter(
        parameterName: PropertyKey,
        expectedType: ValidParameterTypes,
        logger: Logger
    ): any;
    public parameter<T>(
        parameterName: PropertyKey,
        expectedType: ValidParameterTypes,
        logger: Logger,
        builder: (rawParameter: any, logger: Logger) => T
    ): T;
    public parameter<T>(
        parameterName: PropertyKey,
        expectedType: ValidParameterTypes,
        logger: Logger,
        builder?: (rawParameter: any, logger: Logger) => T
    ): any | T;
    /**
     * Returns parameter with specified name and expected type.
     * @param { PropertyKey} parameterName Name of parameter to get.
     * @param { ValidParameterTypes } expectedType Expected type of the parameter.
     * @param { Logger } logger Logger to log this method.
     * @param { function(rawParameter: any, logger: Logger): any } builder Optional builder to build another type
     * from the raw parameter.
     * @return { any } Parameter hand over by firebase function with specified name.
     */
    public parameter(
        parameterName: PropertyKey,
        expectedType: ValidParameterTypes,
        logger: Logger,
        builder?: (rawParameter: any, logger: Logger) => any,
    ): any {
        logger.append('ParameterContainer.parameter', { parameterName, expectedType });

        // Get parameter that is possible optional.
        const parameter = this.optionalParameter(parameterName, expectedType, logger.nextIndent, builder);

        // Check if the parameter is undefined.
        if (parameter == undefined)
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse '${parameterName.toString()}'. Expected type '${expectedType}', but got undefined or null.`,
                logger
            );

        // Return parameter
        return parameter;
    }
}
