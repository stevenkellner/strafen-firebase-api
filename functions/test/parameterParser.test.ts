import { Logger } from '../src/Logger';
import { ParameterParser, ValidTypesOrBuilders } from '../src/ParameterParser';
import { ParameterContainer } from '../src/ParameterContainer';
import { expect } from 'chai';
import { Crypter } from '../src/crypter/Crypter';
import { cryptionKeys } from '../src/privateKeys';
import { DatabaseType } from '../src/TypeDefinitions/DatabaseType';
import { Importance } from '../src/TypeDefinitions/Importance';
import { Amount } from '../src/TypeDefinitions/Amount';
import { PersonName } from '../src/TypeDefinitions/PersonName';

describe('ParameterParser', () => {
    // eslint-disable-next-line require-jsdoc
    function testParameterParser<Parameters>(
        parameterToParse: any,
        typesOrBuilders: ValidTypesOrBuilders<Parameters>,
        expectedParameters: Parameters
    ) {
        const logger = Logger.start(true, 'ParameterParserTest');
        const crypter = new Crypter(cryptionKeys(new DatabaseType('testing')));
        const parameterContainer = new ParameterContainer({
            databaseType: 'testing',
            parameters: crypter.encodeEncrypt(parameterToParse),
        }, logger.nextIndent);
        const parameterParser = new ParameterParser<Parameters>(typesOrBuilders, logger.nextIndent);
        parameterParser.parseParameters(parameterContainer);
        expect(parameterParser.parameters).to.be.deep.equal(expectedParameters);
    }

    it('empty parameter', () => {
        testParameterParser<Record<string, never>>({}, {}, {});
    });

    it('only primitive types and object', () => {
        testParameterParser<{
            value1: string,
            value2: number,
            value3: object,
        }>({
            value1: 'asdf',
            value2: 12,
            value3: {
                subValue1: 'ghjk',
                subValue2: 98,
            },
        }, {
            value1: 'string',
            value2: 'number',
            value3: 'object',
        }, {
            value1: 'asdf',
            value2: 12,
            value3: {
                subValue1: 'ghjk',
                subValue2: 98,
            },
        });
    });

    it('only builders', () => {
        testParameterParser<{
            value1: Importance,
            value2: Amount,
            value3: PersonName,
        }>({
            value1: 'high',
            value2: 12.50,
            value3: {
                first: 'a',
                last: 'b',
            },
        }, {
            value1: ['string', Importance.fromString],
            value2: ['number', Amount.fromNumber],
            value3: ['object', PersonName.fromObject],
        }, {
            value1: new Importance('high'),
            value2: new Amount(12, 50),
            value3: new PersonName('a', 'b'),
        });
    });

    it('primitive types, object and builders', () => {
        testParameterParser<{
            value1: number,
            value2: Importance,
        }>({
            value1: 23.9,
            value2: 'low',
        }, {
            value1: 'number',
            value2: ['string', Importance.fromString],
        }, {
            value1: 23.9,
            value2: new Importance('low'),
        });
    });

    it('builder throws', () => {
        try {
            testParameterParser<{
                value1: Importance,
            }>({
                value1: 'invalid',
            }, {
                value1: ['string', Importance.fromString],
            }, {
                value1: new Importance('medium'),
            });
            expect(true).to.be.false;
        } catch (error: any) {
            expect(error.code).to.be.equal('invalid-argument');
        }
    });

    it('also parse database type', () => {
        testParameterParser<{
            value1: string,
            databaseType: DatabaseType,
        }>({
            value1: 'as',
        }, {
            value1: 'string',
            databaseType: ['string', DatabaseType.fromString],
        }, {
            value1: 'as',
            databaseType: new DatabaseType('testing'),
        });
    });
});
