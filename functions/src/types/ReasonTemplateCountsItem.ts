export type ReasonTemplateCountsItem = 'minute' | 'day' | 'item';

export namespace ReasonTemplateCountsItem {
    export function typeGuard(value: string): value is ReasonTemplateCountsItem {
        return ['minute', 'day', 'item'].includes(value);
    }
}
