import { httpsError } from '../utils';
import { Logger } from '../Logger';

/**
 * Database type of firebase function.
 * Valid database types: `release`, `debug` and `testing`.
 */
export class DatabaseType {

    /**
     * Cunstructs the database type from raw value.
     * @param { 'release' | 'debug' | 'testing' } value Raw value of the database type.
     */
    public constructor(public readonly value: 'release' | 'debug' | 'testing') {}

    /**
     * Url to the database based on the database type.
     */
    public get databaseUrl(): string {
        switch (this.value) {
        case 'release': return 'https://strafen-project-default-rtdb.europe-west1.firebasedatabase.app/';
        case 'debug': return 'https://strafen-project-debug.europe-west1.firebasedatabase.app/';
        case 'testing': return 'https://strafen-project-tests.europe-west1.firebasedatabase.app/';
        }
    }
}

export namespace DatabaseType {

    /**
     * Builds database type from specified value.
     * @param { string } value Value to build database type from.
     * @param { Logger } logger Logger to log this method.
     * @return { DatabaseType } Builded database type.
     */
    export function fromString(value: string, logger: Logger): DatabaseType {
        logger.append('DatabaseType.fromString', { value });

        // Check if value is release, debug or testing.
        if (value !== 'release' && value !== 'debug' && value !== 'testing')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse DatabaseType, expected 'release', 'debug' or 'testing', but got ${value} instead.`,
                logger
            );

        // Return database type.
        return new DatabaseType(value);
    }

    /**
     * Builds database type from specified value.
     * @param { any } value Value to build database type from.
     * @param { Logger } logger Logger to log this method.
     * @return { DatabaseType } Builded database type.
     */
    export function fromValue(value: any, logger: Logger): DatabaseType {
        logger.append('DatabaseType.fromValue', { value });

        // Check if value is from type string.
        if (typeof value !== 'string')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse DatabaseType, expected type 'string', but bot ${value} from type '${typeof value}'`,
                logger
            );

        // Return database type.
        return DatabaseType.fromString(value, logger.nextIndent);
    }
}
