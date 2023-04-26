export type PayedState = 'payed' | 'unpayed';

export namespace PayedState {
    export function typeGuard(value: string): value is PayedState {
        return ['payed', 'unpayed'].includes(value);
    }
}
