export type PayedState = 'payed' | 'unpayed';

export namespace PayedState {
    export function typeGuard(value: string): value is PayedState {
        return ['payed', 'unpayed'].includes(value);
    }

    export function description(payedState: PayedState): string {
        switch (payedState) {
            case 'payed':
                return 'gezahlt';
            case 'unpayed':
                return 'noch offen';
        }
    }
}
