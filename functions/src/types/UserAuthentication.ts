export type UserAuthenticationType = 'clubManager' | 'clubMember';

export namespace UserAuthenticationType {
    export function typeGuard(value: string): value is UserAuthenticationType {
        return ['clubManager', 'clubMember'].includes(value);
    }
}
