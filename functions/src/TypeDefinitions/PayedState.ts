import { httpsError } from '../utils';
import { Logger } from '../Logger';

/**
 * Contains properties if a fine is payed.
 */
export class PayedState {

    /**
     * Constructs payed state with all properties.
     * @param { PayedState.Property } property Properties of the payed state.
     */
    public constructor(public readonly property: PayedState.Property) {}

    /**
     * Fine object that will be stored in the database.
     */
    public get databaseObject(): PayedState.DatabaseObject {
        return {
            state: this.property.state,
            payDate: (this.property as { payDate?: Date }).payDate?.toISOString() ?? null,
            inApp: (this.property as { inApp?: boolean }).inApp ?? null,
        };
    }
}

export namespace PayedState {

    /**
     * Property of a payed state.
     */
    export type Property = {
        state: 'payed',
        inApp: boolean,
        payDate: Date,
    } | {
        state: 'unpayed',
    } | {
        state: 'settled',
    };

    /**
     * Builds payed state from specified value.
     * @param { object } value Value to build payed state from.
     * @param { Logger } logger Logger to log this method.
     * @return { PayedState } Builded payed state.
     */
    export function fromObject(value: object & any, logger: Logger): PayedState {
        logger.append('PayedState.fromObject', { object: value });

        // Check if state is `payed`.
        if (value.state === 'payed') {

            // Check if payDate is a iso string
            if (typeof value.payDate !== 'string' || isNaN(new Date(value.payDate).getTime()))
                throw httpsError(
                    'invalid-argument',
                    `Couldn't parse PayedState parameter 'payDate', expected iso string, but got '${value.payDate}' 
                    from type ${typeof value.payDate}`,
                    logger
                );

            // Check if type of inApp is undefined, null or boolean.
            if (typeof value.inApp !== 'boolean')
                throw httpsError(
                    'invalid-argument',
                    `Couldn't parse PayedState parameter 'inApp'. Expected type 'boolean', but got '${value.inApp}' 
                    from type '${typeof value.inApp}'.`,
                    logger
                );

            // Return payed state
            return new PayedState({ state: value.state, payDate: new Date(value.payDate), inApp: value.inApp });

        }

        // Check if state is `unpayed`.
        if (value.state === 'unpayed')
            return new PayedState({ state: 'unpayed' });

        // Check if state is `settled`.
        if (value.state === 'settled')
            return new PayedState({ state: 'settled' });

        // Throw error since value.state isn't 'payed', 'settled' or 'unpayed'.
        throw httpsError(
            'invalid-argument',
            `Couldn't parse PayedState parameter 'state'. Expected values 'payed', 'settled' or 'unpayed', but got 
            '${value.state}' from type '${typeof value.state}'.`,
            logger
        );
    }

    /**
     * Builds payed state from specified value.
     * @param { any } value Value to build payed state from.
     * @param { Logger } logger Logger to log this method.
     * @return { PayedState } Builded payed state.
     */
    export function fromValue(value: any, logger: Logger): PayedState {
        logger.append('PayedState.fromValue', { object: value });

        // Check if value is from type object
        if (typeof value !== 'object')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse PayedState, expected type 'object', but bot ${value} from type '${typeof value}'`,
                logger
            );

        // Return payed state.
        return PayedState.fromObject(value, logger.nextIndent);
    }

    /**
     * Payed state object that will be stored in the database.
     */
    export interface DatabaseObject {

        /**
         * Raw state of the payed state.
         */
        state: 'payed' | 'unpayed' | 'settled',

        /**
         * Pay date of the payed state if state is `payed`.
         */
        payDate: string | null,

        /**
         * Indicates whether fine is payed in the app if state is `payed`.
         */
        inApp: boolean | null,
    }
}
