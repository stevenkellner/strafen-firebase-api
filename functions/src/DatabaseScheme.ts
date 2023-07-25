import { type CryptedScheme, type DatabaseSchemeType } from 'firebase-function';
import { type Fine } from './types/Fine';
import { type Person } from './types/Person';
import { type ReasonTemplate } from './types/ReasonTemplate';
import { type UserAuthenticationType } from './types/UserAuthentication';

export type DatabaseScheme = DatabaseSchemeType<{
    version: string;
    users: {
        [HashedUserId in string]: CryptedScheme<{
            clubId: string;
            personId: string;
        }>
    };
    invitationLinks: {
        [Id in string]: CryptedScheme<{
            clubId: string;
            personId: string;
        }>
    };
    clubs: {
        [ClubId in string]: {
            name: string;
            paypalMeLink: CryptedScheme<string | null>;
            authentication: {
                [AuthenticationType in UserAuthenticationType]: {
                    [HashedUserId in string]: 'authenticated';
                }
            };
            creator: {
                id: string;
            } | null;
            persons: {
                [PersonId in string]: CryptedScheme<Omit<Person.Flatten, 'id'>>
            };
            reasonTemplates: {
                [ReasonTemplateId in string]: CryptedScheme<Omit<ReasonTemplate.Flatten, 'id'>>
            };
            fines: {
                [FineId in string]: CryptedScheme<Omit<Fine.Flatten, 'id'>>
            };
        }
    };
}>;
