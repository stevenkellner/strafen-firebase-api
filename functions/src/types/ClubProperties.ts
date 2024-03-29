import { HttpsError, type ILogger } from 'firebase-function';
import { Guid } from './Guid';

export type ClubProperties = {
    id: Guid;
    name: string;
    paypalMeLink: string | null;
};

export namespace ClubProperties {
    export function fromObject(value: object | null, logger: ILogger): Omit<ClubProperties, 'id'> {
        logger.log('ClubProperties.fromObject', { value: value });

        if (value === null)
            throw HttpsError('internal', 'Couldn\'t get club properties from null.', logger);

        if (!('name' in value) || typeof value.name !== 'string')
            throw HttpsError('internal', 'Couldn\'t get name for club properties.', logger);

        if ('paypalMeLink' in value && typeof value.paypalMeLink !== 'string' && value.paypalMeLink !== null)
            throw HttpsError('internal', 'Couldn\'t get paypal me link for club properties.', logger);

        return {
            name: value.name,
            paypalMeLink: 'paypalMeLink' in value ? (value.paypalMeLink as string | null) : null
        };
    }

    export type Flatten = {
        id: string;
        name: string;
        paypalMeLink: string | null;
    };

    export function flatten(clubProperties: ClubProperties): ClubProperties.Flatten;
    export function flatten(clubProperties: Omit<ClubProperties, 'id'>): Omit<ClubProperties.Flatten, 'id'>;
    export function flatten(clubProperties: ClubProperties | Omit<ClubProperties, 'id'>): ClubProperties.Flatten | Omit<ClubProperties.Flatten, 'id'> {
        return {
            ...('id' in clubProperties ? { id: clubProperties.id.guidString } : {}),
            name: clubProperties.name,
            paypalMeLink: clubProperties.paypalMeLink
        };
    }

    export function concrete(clubProperties: ClubProperties.Flatten): ClubProperties;
    export function concrete(clubProperties: Omit<ClubProperties.Flatten, 'id'>): Omit<ClubProperties, 'id'>;
    export function concrete(clubProperties: ClubProperties.Flatten | Omit<ClubProperties.Flatten, 'id'>): ClubProperties | Omit<ClubProperties, 'id'> {
        return {
            ...('id' in clubProperties ? { id: new Guid(clubProperties.id) } : {}),
            name: clubProperties.name,
            paypalMeLink: clubProperties.paypalMeLink
        };
    }
}
