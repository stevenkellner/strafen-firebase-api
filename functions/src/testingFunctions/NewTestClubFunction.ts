import * as admin from 'firebase-admin';
import {
    checkPrerequirements,
    IFirebaseFunction,
    httpsError,
    reference,
} from '../utils';
import { ParameterContainer } from '../ParameterContainer';
import { guid } from '../TypeDefinitions/guid';
import { DatabaseType } from '../TypeDefinitions/DatabaseType';
import { Logger } from '../Logger';
import { AuthData } from 'firebase-functions/lib/common/providers/https';
import * as defaultTestClub from './testClubs/default.json';
import { ParameterParser, ValidBuilder } from '../ParameterParser';

// eslint-disable-next-line require-jsdoc
export class NewTestClubFunction implements IFirebaseFunction<
    NewTestClubFunction.Parameters,
    NewTestClubFunction.ReturnType
> {

    /**
     * Firebase function parameters passed to the firebase function.
     */
    public parameters: NewTestClubFunction.Parameters;

    /**
     * Logger to log this class.
     */
    private logger: Logger;

    /**
     * Constructs the firebase function with data and auth.
     * @param { any } data Data passed to this firebase function.
     * @param { AuthData | undefined } auth Authentication of person called this function.
     */
    public constructor(data: any, private readonly auth: AuthData | undefined) {
        this.logger = Logger.start(!!data.verbose, 'NewTestClubFunction.constructor', { data, auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, this.logger.nextIndent);
        const parameterParser = new ParameterParser<NewTestClubFunction.Parameters>(
            {
                privateKey: 'string',
                databaseType: DatabaseType.buildProperties,
                testClubType: TestClubType.buildProperties,
                clubId: guid.buildProperties,
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    /**
     * Execute this firebase function.
     */
    async executeFunction(): Promise<NewTestClubFunction.ReturnType> {
        this.logger.append('NewTestClubFunction.executeFunction', {}, 'info');
        await checkPrerequirements(
            this.parameters.databaseType,
            this.parameters.privateKey,
            this.logger.nextIndent,
            this.auth
        );
        if (this.parameters.databaseType.value !== 'testing')
            throw httpsError('failed-precondition', 'Function can only be called for testing.', this.logger);
        const testClub = this.parameters.testClubType.testClub;
        await this.clubReference.set(testClub, error => {
            if (error != null) throw error;
        });
    }

    /**
     * Reference to club to be created.
     */
    private get clubReference(): admin.database.Reference {
        return reference(
            this.parameters.clubId.guidString,
            this.parameters.databaseType,
            this.logger.nextIndent
        );
    }
}

// eslint-disable-next-line require-jsdoc
class TestClubType {

    readonly value: 'default';

    // eslint-disable-next-line require-jsdoc
    private constructor(value: 'default') {
        this.value = value;
    }

    /**
     * Properties used to build this type.
     */
    static buildProperties: ValidBuilder<TestClubType> = ['string', TestClubType.fromString];

    // eslint-disable-next-line require-jsdoc
    static fromString(value: string, logger: Logger): TestClubType {
        logger.append('TestClubType.fromString', { value });
        if (value != 'default')
            throw httpsError('invalid-argument', `Couldn't parse TestClubType, invalid type: ${value}`, logger);
        return new TestClubType(value);
    }

    // eslint-disable-next-line require-jsdoc
    get testClub(): any {
        switch (this.value) {
        case 'default': return defaultTestClub;
        }
    }
}

export namespace NewTestClubFunction {

    /**
     * Parameters of firebase function.
     */
    export interface Parameters {

        /**
         * Private key to check whether the caller is authenticated to use this function
         */
        privateKey: string,

        /**
         * Database type of the change
         */
        databaseType: DatabaseType,

        /**
         * Id of the club to change the person
         */
        clubId: guid,

        /**
         * Type of the club to create
         */
        testClubType: TestClubType,
    }

    /**
     * Return type of firebase function.
     */
    export type ReturnType = void;
}
