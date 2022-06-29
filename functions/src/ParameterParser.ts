import { Logger } from './Logger';
import { ParameterContainer } from './ParameterContainer';
import { httpsError } from './utils';

type ValidType = 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object';

export type ValidBuilder<T> =
    | ['string', (value: string, logger: Logger) => T]
    | ['number', (value: number, logger: Logger) => T]
    | ['bigint', (value: bigint, logger: Logger) => T]
    | ['boolean', (value: boolean, logger: Logger) => T]
    | ['symbol', (value: symbol, logger: Logger) => T]
    | ['undefined', (value: undefined, logger: Logger) => T]
    | ['object', (value: object, logger: Logger) => T];

type ValidTypeOrBuilder<T = unknown> = ValidType | ValidBuilder<T>;

export type ValidTypesOrBuilders<Parameters> = {
    [Key in keyof Parameters]: ValidTypeOrBuilder<Parameters[Key]>
};

/**
 * Parser to parse firebase function parameters from parameter container.
 */
export class ParameterParser<Parameters> {

    /**
     * Parsed firebase function parameters from parameter container.
     */
    private initialParameters?: Parameters;

    /**
     * Constructs parser with a logger.
     * @param { ValidTypesOrBuilders } typesOrBuilders Types and builders to parse parameters.
     * @param { Logger } logger Logger to log this class.
     */
    public constructor(private readonly typesOrBuilders: ValidTypesOrBuilders<Parameters>, private logger: Logger) {}

    /**
     * Parsed firebase function parameters from parameter container.
     */
    public get parameters(): Parameters {
        if (this.initialParameters === undefined)
            throw httpsError(
                'internal',
                'Tried to access parameters before those parameters were parsed.',
                this.logger
            );
        return this.initialParameters;
    }

    /**
     * Parse firebase function parameters from parameter container.
     * @param { ParameterContainer } container Parameter container to parse firebase function parameters from.
     */
    public parseParameters(container: ParameterContainer): void {
        this.logger.append('ParameterParser.parseParameters', { container });

        // Parse parametes
        this.initialParameters = {} as any;
        for (const entry of Object.entries(this.typesOrBuilders)) {
            const parameterName = entry[0] as PropertyKey;
            const typeOrBuilder = entry[1] as ValidTypeOrBuilder<any>;
            let parameter: any;
            if (Array.isArray(typeOrBuilder)) {
                parameter = container.parameter(
                    parameterName,
                    typeOrBuilder[0],
                    this.logger.nextIndent,
                    typeOrBuilder[1]
                );
            } else {
                parameter = container.parameter(
                    parameterName,
                    typeOrBuilder,
                    this.logger.nextIndent
                );
            }
            (this.initialParameters as any)[parameterName] = parameter;
        }
    }
}
