import { ParameterContainer } from '../ParameterContainer';
import { httpsError } from '../utils';
import { Logger } from '../Logger';

/**
 * Contains an amount value with value and subunit value.
 * Valid amount number: `42.50`.
 */
export class Amount {

    /**
     * Constructs an amount value with value and subunit value.
     * @param { number } value Value of the amount.
     * @param { number } subUnitValue Subunit value of the amount.
     */
    public constructor(
        private readonly value: number,
        private readonly subUnitValue: number
    ) {}

    /**
     * Number value of the amount.
     */
    get numberValue(): number {
        return this.value + this.subUnitValue / 100;
    }
}

export namespace Amount {

    /**
     * Builds amount from specified value.
     * @param { any } value Value to build amount from.
     * @param { Logger } logger Logger to log this method.
     * @return { Amount } Builded amount.
     */
    export function fromNumber(value: number, logger: Logger): Amount {
        logger.append('Amount.fromNumber', { value });

        // Check if number is positiv
        if (value < 0)
            throw httpsError('invalid-argument', 'Couldn\'t parse Amount since value is negative.', logger);

        // Build and return amount.
        const amountValue = Math.floor(value);
        const subUnitValue = (value - amountValue) * 100;
        return new Amount(amountValue, Math.floor(subUnitValue));
    }

    /**
     * Builds amount from specified value.
     * @param { any } value Value to build amount from.
     * @param { Logger } logger Logger to log this method.
     * @return { Amount } Builded amount.
     */
    export function fromValue(value: any, logger: Logger): Amount {
        logger.append('Amount.fromValue', { value });

        // Check if value is from type number
        if (typeof value !== 'number')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse amount, expected type 'number', but bot ${value} from type '${typeof value}'`,
                logger
            );

        // Return amount.
        return Amount.fromNumber(value, logger.nextIndent);
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * @deprecated Use `container.parameter(parameterName, 'number', logger.nextIndent,
     * Amount.fromString)` instead.
     */
    export function fromParameterContainer(
        container: ParameterContainer,
        parameterName: string,
        logger: Logger
    ): Amount {
        logger.append('Amount.fromParameterContainer', { container, parameterName });

        // Build and return amount.
        return Amount.fromNumber(
            container.parameter(parameterName, 'number', logger.nextIndent),
            logger.nextIndent
        );
    }
}
