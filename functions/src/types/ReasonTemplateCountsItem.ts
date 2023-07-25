export type ReasonTemplateCountsItem = 'minute' | 'day' | 'item';

export namespace ReasonTemplateCountsItem {
    export function typeGuard(value: string): value is ReasonTemplateCountsItem {
        return ['minute', 'day', 'item'].includes(value);
    }

    export function description(item: ReasonTemplateCountsItem): string {
        switch (item) {
            case 'minute':
                return 'Minute';
            case 'day':
                return 'Tag';
            case 'item':
                return 'Teil';
        }
    }
}
