export type EditType = 'add' | 'update' | 'delete';

export namespace EditType {
    export function typeGuard(value: string): value is EditType {
        return ['add', 'update', 'delete'].includes(value);
    }
}
