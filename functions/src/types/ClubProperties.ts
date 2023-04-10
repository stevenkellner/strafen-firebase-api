import { HttpsError, type ILogger } from 'firebase-function';
import { Guid } from './Guid';

export type ClubProperties = {
    id: Guid;
    name: string;
    regionCode: string;
    inAppPaymentActive: boolean;
};

export namespace ClubProperties {
    export function fromObject(value: object | null, logger: ILogger): Omit<ClubProperties, 'id'> {
        logger.log('ClubProperties.fromObject', { value: value });

        if (value === null)
            throw HttpsError('internal', 'Couldn\'t get club properties from null.', logger);

        if (!('name' in value) || typeof value.name !== 'string')
            throw HttpsError('internal', 'Couldn\'t get name for club properties.', logger);

        if (!('regionCode' in value) || typeof value.regionCode !== 'string')
            throw HttpsError('internal', 'Couldn\'t get region code for club properties.', logger);

        if (!('inAppPaymentActive' in value) || typeof value.inAppPaymentActive !== 'boolean')
            throw HttpsError('internal', 'Couldn\'t get inAppPaymentActive for club properties.', logger);

        return {
            name: value.name,
            regionCode: value.regionCode,
            inAppPaymentActive: value.inAppPaymentActive
        };
    }

    export type Flatten = {
        id: string;
        name: string;
        regionCode: string;
        inAppPaymentActive: boolean;
    };

    export function flatten(clubProperties: ClubProperties): ClubProperties.Flatten;
    export function flatten(clubProperties: Omit<ClubProperties, 'id'>): Omit<ClubProperties.Flatten, 'id'>;
    export function flatten(clubProperties: ClubProperties | Omit<ClubProperties, 'id'>): ClubProperties.Flatten | Omit<ClubProperties.Flatten, 'id'> {
        return {
            ...('id' in clubProperties ? { id: clubProperties.id.guidString } : {}),
            name: clubProperties.name,
            regionCode: clubProperties.regionCode,
            inAppPaymentActive: clubProperties.inAppPaymentActive
        };
    }

    export function concrete(clubProperties: ClubProperties.Flatten): ClubProperties;
    export function concrete(clubProperties: Omit<ClubProperties.Flatten, 'id'>): Omit<ClubProperties, 'id'>;
    export function concrete(clubProperties: ClubProperties.Flatten | Omit<ClubProperties.Flatten, 'id'>): ClubProperties | Omit<ClubProperties, 'id'> {
        return {
            ...('id' in clubProperties ? { id: new Guid(clubProperties.id) } : {}),
            name: clubProperties.name,
            regionCode: clubProperties.regionCode,
            inAppPaymentActive: clubProperties.inAppPaymentActive
        };
    }
}
