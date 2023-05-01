import { HttpsError, type ILogger } from 'firebase-function';
import { UserAuthenticationType } from './UserAuthentication';

export type SignInData = {
    hashedUserId: string;
    signInDate: Date;
    authentication: UserAuthenticationType[];
    notificationTokens: Record<string, string>;
};

export namespace SignInData {
    export function fromObject(value: object | null, logger: ILogger): SignInData | undefined {
        logger.log('SignInData.fromObject', { value: value });

        if (value === null)
            return undefined;

        if (!('hashedUserId' in value) || typeof value.hashedUserId !== 'string')
            throw HttpsError('internal', 'Couldn\'t get hashed user id for sign in data.', logger);

        if (!('signInDate' in value) || typeof value.signInDate !== 'string')
            throw HttpsError('internal', 'Couldn\'t get sign in date for sign in data.', logger);

        if (!('authentication' in value) || !Array.isArray(value.authentication))
            throw HttpsError('internal', 'Couldn\'t get authentication for sign in data.', logger);

        const authentication = value.authentication.map((value: unknown) => {
            if (typeof value !== 'string' || !UserAuthenticationType.typeGuard(value))
                throw HttpsError('internal', 'Couldn\'t get authentication for sign in data.', logger);
            return value;
        });

        if (!('notificationTokens' in value) || typeof value.notificationTokens !== 'object' || value.notificationTokens === null)
            throw HttpsError('internal', 'Couldn\'t get notification tokens for sign in data.', logger);

        const notificationTokens = Object.entries(value.notificationTokens).reduce((tokens: Record<string, string>, entry: [string, unknown]) => {
            if (typeof entry[1] !== 'string')
                throw HttpsError('internal', 'Couldn\'t get notification tokens for sign in data.', logger);
            tokens[entry[0]] = entry[1];
            return tokens;
        }, {});

        return {
            hashedUserId: value.hashedUserId,
            signInDate: new Date(value.signInDate),
            authentication: authentication,
            notificationTokens: notificationTokens
        };
    }

    export type Flatten = {
        hashedUserId: string;
        signInDate: string;
        authentication: UserAuthenticationType[];
        notificationTokens: Record<string, string>;
    };

    export function flatten(signInData: SignInData): SignInData.Flatten;
    export function flatten(signInData: SignInData | undefined): SignInData.Flatten | null;
    export function flatten(signInData: SignInData | undefined): SignInData.Flatten | null {
        if (signInData === undefined)
            return null;
        return {
            hashedUserId: signInData.hashedUserId,
            signInDate: signInData.signInDate.toISOString(),
            authentication: signInData.authentication,
            notificationTokens: signInData.notificationTokens
        };
    }

    export function concrete(signInData: SignInData.Flatten): SignInData;
    export function concrete(signInData: SignInData.Flatten | null): SignInData | undefined;
    export function concrete(signInData: SignInData.Flatten | null): SignInData | undefined {
        if (signInData === null)
            return undefined;
        return {
            hashedUserId: signInData.hashedUserId,
            signInDate: new Date(signInData.signInDate),
            authentication: signInData.authentication,
            notificationTokens: signInData.notificationTokens
        };
    }
}
