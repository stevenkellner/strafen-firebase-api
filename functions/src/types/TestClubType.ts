import * as defaultTestClub from '../testClubs/default.json';
import { type Fine } from './Fine';
import { type Person } from './Person';
import { type ReasonTemplate } from './ReasonTemplate';
import { type UserAuthenticationType } from './UserAuthentication';

export type TestClubType = 'default';

export namespace TestClubType {
    export function typeGuard(value: string): value is TestClubType {
        return ['default'].includes(value);
    }

    export function testClub(type: TestClubType): TestClub {
        switch (type) {
            case 'default': return defaultTestClub as TestClub;
        }
    }
}

export type TestClub = {
    name: string;
    authentication: {
        [AuthenticationType in UserAuthenticationType]: {
            [HashedUserId in string]: 'authenticated';
        }
    };
    persons: {
        [PersonId in string]: Omit<Person.Flatten, 'id'>
    };
    reasonTemplates: {
        [ReasonTemplateId in string]: Omit<ReasonTemplate.Flatten, 'id'>
    };
    fines: {
        [FineId in string]: Omit<Fine.Flatten, 'id'>
    };
};
