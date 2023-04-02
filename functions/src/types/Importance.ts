export type Importance = 'high' | 'medium' | 'low';

export namespace Importance {
    export function typeGuard(value: string): value is Importance {
        return ['high', 'medium', 'low'].includes(value);
    }
}
