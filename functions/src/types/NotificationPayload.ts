import { HttpsError, type ILogger } from 'firebase-function';

export type NotificationPayload = {
    title: string;
    body: string;
};

export namespace NotificationPayload {
    export function fromObject(value: object | null, logger: ILogger): NotificationPayload {
        logger.log('Event.fromObject', { value: value });

        if (value === null)
            throw HttpsError('internal', 'Couldn\'t get notification payload from null.', logger);

        if (!('title' in value) || typeof value.title !== 'string')
            throw HttpsError('internal', 'Couldn\'t get title for notification payload.', logger);

        if (!('body' in value) || typeof value.body !== 'string')
            throw HttpsError('internal', 'Couldn\'t get body for notification payload.', logger);

        return {
            title: value.title,
            body: value.body
        };
    }
}
