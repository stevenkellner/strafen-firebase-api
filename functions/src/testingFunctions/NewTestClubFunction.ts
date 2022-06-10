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
import { defaultTestClub } from './testClubs/default';

// eslint-disable-next-line require-jsdoc
export class NewTestClubFunction implements IFirebaseFunction<
    Parameters, ReturnType, ParameterParser
> {

    /**
     * All parameters passed by firebase function.
     */
    private parameterContainer: ParameterContainer;

    /**
     * Parser to parse firebase function parameters from parameter container.
     */
    public parameterParser: ParameterParser;

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
        this.parameterContainer = new ParameterContainer(data);
        this.logger = Logger.start(
            this.parameterContainer,
            'NewTestClubFunction.constructor',
            { data, auth },
            'notice'
        );
        this.parameterParser = new ParameterParser(this.logger.nextIndent);
        this.parameterParser.parseParameters(this.parameterContainer);
    }

    /**
     * Firebase function parameters passed to the firebase function.
     */
    public get parameters(): Parameters {
        return this.parameterParser.parameters;
    }

    /**
     * Execute this firebase function.
     */
    async executeFunction(): Promise<void> {
        this.logger.append('NewTestClubFunction.executeFunction', {}, 'info');
        await checkPrerequirements(this.parameterContainer, this.logger.nextIndent, this.auth);
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
            this.parameterContainer,
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

/**
 * Parameters of firebase function.
 */
interface Parameters {

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
type ReturnType = void;

/**
 * Parser to parse firebase function parameters from parameter container.
 * @template Parameters Type of the fireabse function parameters.
 */
class ParameterParser implements IFirebaseFunction.IParameterParser<Parameters> {

    /**
     * Parsed firebase function parameters from parameter container.
     */
    private initialParameters?: Parameters;

    /**
     * Constructs parser with a logger.
     * @param { Logger } logger Logger to log this class.
     */
    public constructor(private logger: Logger) {}

    /**
     * Parsed firebase function parameters from parameter container.
     */
    public get parameters(): Parameters {
        if (this.initialParameters === undefined)
            throw httpsError(
                'internal',
                'Tried to access parameters before those parameters were parsed.',
                this.logger
            );
        return this.initialParameters;
    }

    /**
     * Parse firebase function parameters from parameter container.
     * @param { ParameterContainer } container Parameter container to parse firebase function parameters from.
     */
    public parseParameters(container: ParameterContainer): void {
        this.logger.append('ParameterParser.parseParameters', { container });

        // Parse parametes
        this.initialParameters = {
            privateKey: container.parameter('privateKey', 'string', this.logger.nextIndent),
            databaseType: container.parameter(
                'databaseType',
                'string',
                this.logger.nextIndent,
                DatabaseType.fromString
            ),
            clubId: container.parameter('clubId', 'string', this.logger.nextIndent, guid.fromString),
            testClubType: container.parameter(
                'testClubType',
                'string',
                this.logger.nextIndent,
                TestClubType.fromString
            ),
        };
    }
}
