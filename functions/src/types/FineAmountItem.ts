export type FineAmountItem = 'crateOfBeer';

export namespace FineAmountItem {
    export function typeGuard(value: string): value is FineAmountItem {
        return ['crateOfBeer'].includes(value);
    }

    export function description(item: FineAmountItem): string {
        switch (item) {
            case 'crateOfBeer':
                return 'Kasten';
        }
    }
}
