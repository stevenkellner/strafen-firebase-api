import { assert, expect } from 'chai';
import { Amount } from '../src/TypeDefinitions/Amount';
import { ChangeType } from '../src/TypeDefinitions/ChangeType';
import { DatabaseType } from '../src/TypeDefinitions/DatabaseType';
import { ClubProperties } from '../src/TypeDefinitions/ClubProperties';
import { Fine } from '../src/TypeDefinitions/Fine';
import { FineReason } from '../src/TypeDefinitions/FineReason';
import { guid } from '../src/TypeDefinitions/guid';
import { Importance } from '../src/TypeDefinitions/Importance';
import { LatePaymentInterest } from '../src/TypeDefinitions/LatePaymentInterest';
import { Logger } from '../src/Logger';
import { PayedState } from '../src/TypeDefinitions/PayedState';
import { Person } from '../src/TypeDefinitions/Person';
import { PersonName } from '../src/TypeDefinitions/PersonName';
import { PersonPropertiesWithIsAdmin } from '../src/TypeDefinitions/PersonPropertiesWithIsAdmin';
import { PersonPropertiesWithUserId } from '../src/TypeDefinitions/PersonPropertiesWithUserId';
import { ReasonTemplate } from '../src/TypeDefinitions/ReasonTemplate';
import { Updatable } from '../src/TypeDefinitions/Updatable';
import { Deleted } from '../src/utils';
import { errorCodeAndMessage } from './utils';

describe('TypeDefinitionsBuilder', () => {

    const logger = Logger.start(true, 'typeDefinitionsBuilderTest', {}, 'notice');

    describe('AmountBuilder', () => {

        logger.append('AmountBuilder', undefined, 'info');

        it('Value no number', () => {
            try {
                Amount.fromValue('12.50', logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse amount, expected type \'number\', but bot 12.50 from type \'string\'',
                });
            }
        });

        it('Value negative number', () => {
            try {
                Amount.fromNumber(-10, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse Amount since value is negative.',
                });
            }
        });

        it('Value zero number', () => {
            const amount = Amount.fromNumber(0, logger.nextIndent);
            expect(amount).to.be.deep.equal(new Amount(0, 0));
        });

        it('Value large subunit value', () => {
            const amount = Amount.fromNumber(1.298, logger.nextIndent);
            expect(amount).to.be.deep.equal(new Amount(1, 29));
        });

        it('Value no subunit value', () => {
            const amount = Amount.fromNumber(34, logger.nextIndent);
            expect(amount).to.be.deep.equal(new Amount(34, 0));
        });
    });

    describe('ChangeTypeBuilder', () => {

        logger.append('ChangeTypeBuilder', undefined, 'info');

        it('Value no string', () => {
            try {
                ChangeType.fromValue(['asdf'], logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse ChangeType, expected type \'string\', but bot asdf from type \'object\'',
                });
            }
        });

        it('Invalid value', () => {
            try {
                ChangeType.fromString('invalid', logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse ChangeType, expected \'delete\' or \'update\', but got invalid instead.',
                });
            }
        });

        it('Value update', () => {
            const changeType = ChangeType.fromString('update', logger.nextIndent);
            expect(changeType).to.be.deep.equal(new ChangeType('update'));
        });

        it('Value delete', () => {
            const changeType = ChangeType.fromString('delete', logger.nextIndent);
            expect(changeType).to.be.deep.equal(new ChangeType('delete'));
        });
    });

    describe('ClubPropertiesBuilder', () => {

        logger.append('ClubPropertiesBuilder', undefined, 'info');

        it('Value no object', () => {
            try {
                ClubProperties.fromValue('asdf', logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse club properties, expected type \'object\', but bot asdf from type \'string\'',
                });
            }
        });

        it('Value has no id', () => {
            try {
                ClubProperties.fromObject({}, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse club properties parameter \'id\'. Expected type \'string\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong id type', () => {
            try {
                ClubProperties.fromObject({
                    id: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse club properties parameter \'id\'. Expected type \'string\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value has invalid id guid', () => {
            try {
                ClubProperties.fromObject({
                    id: 'invalid',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse Guid, guid string isn\'t a valid Guid: invalid',
                });
            }
        });

        it('Value has no name', () => {
            try {
                ClubProperties.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse club properties parameter \'name\'. Expected type \'string\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong name type', () => {
            try {
                ClubProperties.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    name: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse club properties parameter \'name\'. Expected type \'string\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value has no identifier', () => {
            try {
                ClubProperties.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    name: 'my name',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse club properties parameter \'identifier\'. Expected type \'string\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong identifier type', () => {
            try {
                ClubProperties.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    name: 'my name',
                    identifier: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse club properties parameter \'identifier\'. Expected type \'string\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value has no regionCode', () => {
            try {
                ClubProperties.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    name: 'my name',
                    identifier: 'my id',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse club properties parameter \'regionCode\'. Expected type \'string\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong regionCode type', () => {
            try {
                ClubProperties.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    name: 'my name',
                    identifier: 'my id',
                    regionCode: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse club properties parameter \'regionCode\'. Expected type \'string\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value has no inAppPaymentActive', () => {
            try {
                ClubProperties.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    name: 'my name',
                    identifier: 'my id',
                    regionCode: 'my rc',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse club properties parameter \'inAppPaymentActive\'. Expected type \'boolean\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong inAppPaymentActive type', () => {
            try {
                ClubProperties.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    name: 'my name',
                    identifier: 'my id',
                    regionCode: 'my rc',
                    inAppPaymentActive: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse club properties parameter \'inAppPaymentActive\'. Expected type \'boolean\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value valid', () => {
            const clubProperties = ClubProperties.fromObject({
                id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                name: 'my name',
                identifier: 'my id',
                regionCode: 'my rc',
                inAppPaymentActive: true,
            }, logger.nextIndent);
            expect(clubProperties).to.be.deep.equal(new ClubProperties(
                guid.fromString('4ED90BA2-D536-4B2B-A93E-403987A056CC', logger.nextIndent),
                'my name', 'my id', 'my rc', true
            ));
        });
    });

    describe('DatabaseTypeBuilder', () => {

        logger.append('DatabaseTypeBuilder', undefined, 'info');

        it('Value no string', () => {
            try {
                DatabaseType.fromValue(['asdf'], logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse DatabaseType, expected type \'string\', but bot asdf from type \'object\'',
                });
            }
        });

        it('Invalid value', () => {
            try {
                DatabaseType.fromValue('invalid', logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse DatabaseType, expected \'release\', \'debug\' or \'testing\', but got invalid instead.',
                });
            }
        });

        it('Value release', () => {
            const databaseType = DatabaseType.fromString('release', logger.nextIndent);
            expect(databaseType).to.be.deep.equal(new DatabaseType('release'));
        });

        it('Value debug', () => {
            const databaseType = DatabaseType.fromString('debug', logger.nextIndent);
            expect(databaseType).to.be.deep.equal(new DatabaseType('debug'));
        });

        it('Value testing', () => {
            const databaseType = DatabaseType.fromString('testing', logger.nextIndent);
            expect(databaseType).to.be.deep.equal(new DatabaseType('testing'));
        });
    });

    describe('FineBuilder', () => {

        logger.append('FineBuilder', undefined, 'info');

        it('Value no object', () => {
            try {
                Fine.fromValue('asdf', logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse fine, expected type \'object\', but bot asdf from type \'string\'',
                });
            }
        });

        it('Value has no id', () => {
            try {
                Fine.fromObject({}, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse fine parameter \'id\', expected type string but got \'undefined\' from type undefined',
                });
            }
        });

        it('Value has wrong id type', () => {
            try {
                Fine.fromObject({
                    id: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse fine parameter \'id\', expected type string but got \'1234\' from type number',
                });
            }
        });

        it('Value has invalid id guid', () => {
            try {
                Fine.fromObject({
                    id: 'invalid',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse Guid, guid string isn\'t a valid Guid: invalid',
                });
            }
        });

        it('Value has wrong deleted type', () => {
            try {
                Fine.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    deleted: 'asdf',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse fine, deleted argument wasn\'t from type boolean or was false.',
                });
            }
        });

        it('Value has deleted false', () => {
            try {
                Fine.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    deleted: false,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse fine, deleted argument wasn\'t from type boolean or was false.',
                });
            }
        });

        it('Value has deleted true', () => {
            const fine = Fine.fromObject({
                id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                deleted: true,
            }, logger.nextIndent);
            expect(fine).to.be.deep
                .equal(new Deleted<guid>(guid.fromString('4ED90BA2-D536-4B2B-A93E-403987A056CC', logger.nextIndent)));
        });

        it('Value has no person id', () => {
            try {
                Fine.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse fine parameter \'personId\', expected type string but got \'undefined\' from type undefined',
                });
            }
        });

        it('Value has wrong person id type', () => {
            try {
                Fine.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    personId: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse fine parameter \'personId\', expected type string but got \'1234\' from type number',
                });
            }
        });

        it('Value has invalid person id guid', () => {
            try {
                Fine.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    personId: 'invalid',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse Guid, guid string isn\'t a valid Guid: invalid',
                });
            }
        });

        it('Value has no payed state', () => {
            try {
                Fine.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    personId: 'd3373dc9-099d-413b-bc4d-d921b2b27d29',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse fine parameter \'payedState\', expected type object but got \'undefined\' from type undefined',
                });
            }
        });

        it('Value has wrong payed state type', () => {
            try {
                Fine.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    personId: 'd3373dc9-099d-413b-bc4d-d921b2b27d29',
                    payedState: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse fine parameter \'payedState\', expected type object but got \'1234\' from type number',
                });
            }
        });

        it('Value has no number', () => {
            try {
                Fine.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    personId: 'd3373dc9-099d-413b-bc4d-d921b2b27d29',
                    payedState: {
                        state: 'settled',
                        updateProperties: {
                            timestamp: '2011-10-16T10:42:38+0000',
                            personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                        },
                    },
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse fine parameter \'number\', expected unsigned integer greater zero but got \'undefined\' from type undefined',
                });
            }
        });

        it('Value has wrong number type', () => {
            try {
                Fine.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    personId: 'd3373dc9-099d-413b-bc4d-d921b2b27d29',
                    payedState: {
                        state: 'settled',
                        updateProperties: {
                            timestamp: '2011-10-16T10:42:38+0000',
                            personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                        },
                    },
                    number: '1234',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse fine parameter \'number\', expected unsigned integer greater zero but got \'1234\' from type string',
                });
            }
        });

        it('Value has negative number', () => {
            try {
                Fine.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    personId: 'd3373dc9-099d-413b-bc4d-d921b2b27d29',
                    payedState: {
                        state: 'settled',
                        updateProperties: {
                            timestamp: '2011-10-16T10:42:38+0000',
                            personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                        },
                    },
                    number: -12,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse fine parameter \'number\', expected unsigned integer greater zero but got \'-12\' from type number',
                });
            }
        });

        it('Value has zero number', () => {
            try {
                Fine.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    personId: 'd3373dc9-099d-413b-bc4d-d921b2b27d29',
                    payedState: {
                        state: 'settled',
                        updateProperties: {
                            timestamp: '2011-10-16T10:42:38+0000',
                            personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                        },
                    },
                    number: 0,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse fine parameter \'number\', expected unsigned integer greater zero but got \'0\' from type number',
                });
            }
        });

        it('Value has decimal number', () => {
            try {
                Fine.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    personId: 'd3373dc9-099d-413b-bc4d-d921b2b27d29',
                    payedState: {
                        state: 'settled',
                        updateProperties: {
                            timestamp: '2011-10-16T10:42:38+0000',
                            personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                        },
                    },
                    number: 1.5,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse fine parameter \'number\', expected unsigned integer greater zero but got \'1.5\' from type number',
                });
            }
        });

        it('Value has no date', () => {
            try {
                Fine.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    personId: 'd3373dc9-099d-413b-bc4d-d921b2b27d29',
                    payedState: {
                        state: 'settled',
                        updateProperties: {
                            timestamp: '2011-10-16T10:42:38+0000',
                            personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                        },
                    },
                    number: 1,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse fine parameter \'date\', expected iso string but got \'undefined\' from type undefined',
                });
            }
        });

        it('Value has wrong date type', () => {
            try {
                Fine.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    personId: 'd3373dc9-099d-413b-bc4d-d921b2b27d29',
                    payedState: {
                        state: 'settled',
                        updateProperties: {
                            timestamp: '2011-10-16T10:42:38+0000',
                            personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                        },
                    },
                    number: 1,
                    date: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse fine parameter \'date\', expected iso string but got \'1234\' from type number',
                });
            }
        });

        it('Value has invalid date format', () => {
            try {
                Fine.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    personId: 'd3373dc9-099d-413b-bc4d-d921b2b27d29',
                    payedState: {
                        state: 'settled',
                        updateProperties: {
                            timestamp: '2011-10-16T10:42:38+0000',
                            personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                        },
                    },
                    number: 1,
                    date: 'invalid',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse fine parameter \'date\', expected iso string but got \'invalid\' from type string',
                });
            }
        });

        it('Value has no fine reason', () => {
            try {
                Fine.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    personId: 'd3373dc9-099d-413b-bc4d-d921b2b27d29',
                    payedState: {
                        state: 'settled',
                        updateProperties: {
                            timestamp: '2011-10-16T10:42:38+0000',
                            personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                        },
                    },
                    number: 1,
                    date: '2011-10-16T10:42:38+0000',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse fine parameter \'fineReason\', expected type object but got \'undefined\' from type undefined',
                });
            }
        });

        it('Value has wrong fine reason type', () => {
            try {
                Fine.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    personId: 'd3373dc9-099d-413b-bc4d-d921b2b27d29',
                    payedState: {
                        state: 'settled',
                        updateProperties: {
                            timestamp: '2011-10-16T10:42:38+0000',
                            personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                        },
                    },
                    number: 1,
                    date: '2011-10-16T10:42:38+0000',
                    fineReason: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse fine parameter \'fineReason\', expected type object but got \'1234\' from type number',
                });
            }
        });

        it('Value has invalid fine reason', () => {
            try {
                Fine.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    personId: 'd3373dc9-099d-413b-bc4d-d921b2b27d29',
                    payedState: {
                        state: 'settled',
                        updateProperties: {
                            timestamp: '2011-10-16T10:42:38+0000',
                            personId: '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
                        },
                    },
                    number: 1,
                    date: '2011-10-16T10:42:38+0000',
                    fineReason: {},
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse FineReason parameter \'reasonMessage\'. Expected type \'string\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value valid', () => {
            const fine = Fine.fromObject({
                id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                personId: 'd3373dc9-099d-413b-bc4d-d921b2b27d29',
                payedState: {
                    state: 'settled',
                },
                number: 1,
                date: '2011-10-16T10:42:38+0000',
                fineReason: {
                    reasonMessage: 'asdf',
                    amount: 2.50,
                    importance: 'low',
                },
            }, logger.nextIndent);
            expect(fine).to.be.deep.equal(new Fine(
                guid.fromString('4ED90BA2-D536-4B2B-A93E-403987A056CC', logger.nextIndent),
                guid.fromString('d3373dc9-099d-413b-bc4d-d921b2b27d29', logger.nextIndent),
                new PayedState({
                    state: 'settled',
                }),
                1, new Date('2011-10-16T10:42:38+0000'),
                new FineReason('asdf', new Amount(2, 50), new Importance('low')),
            ));
        });
    });

    describe('FineReasonBuilder', () => {

        logger.append('FineReasonBuilder', undefined, 'info');

        it('Value no object', () => {
            try {
                FineReason.fromValue('asdf', logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse FineReason, expected type \'object\', but bot asdf from type \'string\'',
                });
            }
        });

        it('Value invalid', () => {
            try {
                FineReason.fromObject({
                    reason: 'asdf',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse FineReason parameter \'reasonMessage\'. Expected type \'string\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value valid', () => {
            const fineReason = FineReason.fromObject({
                reasonMessage: 'asdf',
                amount: 12.50,
                importance: 'low',
            }, logger.nextIndent);
            expect(fineReason).to.be.deep.equal(new FineReason(
                'asdf', new Amount(12, 50), new Importance('low'),
            ));
        });
    });

    describe('guidBuilder', () => {

        logger.append('guidBuilder', undefined, 'info');

        it('Value no string', () => {
            try {
                guid.fromValue(['asdf'], logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse guid, expected type \'string\', but bot asdf from type \'object\'',
                });
            }
        });

        it('Invalid value', () => {
            try {
                guid.fromString('invalid', logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse Guid, guid string isn\'t a valid Guid: invalid',
                });
            }
        });

        it('Valid value', () => {
            const guid_ = guid.fromString('fabf4ed1-d1d9-4b2a-b5bf-fc5f714c3eba', logger.nextIndent);
            expect(guid_.guidString).to.be.equal('FABF4ED1-D1D9-4B2A-B5BF-FC5F714C3EBA');
        });
    });

    describe('ImportanceBuilder', () => {

        logger.append('ImportanceBuilder', undefined, 'info');

        it('Value no string', () => {
            try {
                Importance.fromValue(['asdf'], logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse Importance, expected type \'string\', but bot asdf from type \'object\'',
                });
            }
        });

        it('Invalid value', () => {
            try {
                Importance.fromString('invalid', logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse Importance, expected \'high\', \'medium\' or \'low\', but got invalid instead.',
                });
            }
        });

        it('Value high', () => {
            const importance = Importance.fromString('high', logger.nextIndent);
            expect(importance).to.be.deep.equal(new Importance('high'));
        });

        it('Value medium', () => {
            const importance = Importance.fromString('medium', logger.nextIndent);
            expect(importance).to.be.deep.equal(new Importance('medium'));
        });

        it('Value low', () => {
            const importance = Importance.fromString('low', logger.nextIndent);
            expect(importance).to.be.deep.equal(new Importance('low'));
        });
    });

    describe('LatePaymentInterestBuilder', () => {

        logger.append('LatePaymentInterestBuilder', undefined, 'info');

        it('Value no object', () => {
            try {
                LatePaymentInterest.fromValue('asdf', logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse LatePaymentInterest, expected type \'object\', but bot asdf from type \'string\'',
                });
            }
        });

        it('Value has wrong deleted type', () => {
            try {
                LatePaymentInterest.fromObject({
                    deleted: 'asdf',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse interest, deleted argument wasn\'t from type boolean or was false.',
                });
            }
        });

        it('Value has deleted false', () => {
            try {
                LatePaymentInterest.fromObject({
                    deleted: false,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse interest, deleted argument wasn\'t from type boolean or was false.',
                });
            }
        });

        it('Value has deleted true', () => {
            const latePaymentInterest = LatePaymentInterest.fromObject({
                deleted: true,
            }, logger.nextIndent);
            expect(latePaymentInterest).to.be.deep.equal(new Deleted<null>(null));
        });

        it('Value has no interestFreePeriod', () => {
            try {
                LatePaymentInterest.fromObject({}, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse LatePaymentInterest parameter \'interestFreePeriod\'. Expected type \'object\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong interestFreePeriod type', () => {
            try {
                LatePaymentInterest.fromObject({
                    interestFreePeriod: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse LatePaymentInterest parameter \'interestFreePeriod\'. Expected type \'object\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value has interestFreePeriod with no value', () => {
            try {
                LatePaymentInterest.fromObject({
                    interestFreePeriod: {},
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse TimePeriod parameter \'value\'. Expected type \'number\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has interestFreePeriod with wrong value type', () => {
            try {
                LatePaymentInterest.fromObject({
                    interestFreePeriod: {
                        value: '1234',
                    },
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse TimePeriod parameter \'value\'. Expected type \'number\', but got \'1234\' from type \'string\'.',
                });
            }
        });

        it('Value has interestFreePeriod with no unit', () => {
            try {
                LatePaymentInterest.fromObject({
                    interestFreePeriod: {
                        value: 1234,
                    },
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse TimePeriod parameter \'unit\'. Expected \'day\', \'month\' or \'year\' from type \'string\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has interestFreePeriod with wrong unit type', () => {
            try {
                LatePaymentInterest.fromObject({
                    interestFreePeriod: {
                        value: 1234,
                        unit: 12,
                    },
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse TimePeriod parameter \'unit\'. Expected \'day\', \'month\' or \'year\' from type \'string\', but got \'12\' from type \'number\'.',
                });
            }
        });

        it('Value has interestFreePeriod with invalid unit', () => {
            try {
                LatePaymentInterest.fromObject({
                    interestFreePeriod: {
                        value: 1234,
                        unit: 'invalid',
                    },
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse TimePeriod parameter \'unit\'. Expected \'day\', \'month\' or \'year\' from type \'string\', but got \'invalid\' from type \'string\'.',
                });
            }
        });

        it('Value has no interestPeriod', () => {
            try {
                LatePaymentInterest.fromObject({
                    interestFreePeriod: {
                        value: 10,
                        unit: 'month',
                    },
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse LatePaymentInterest parameter \'interestPeriod\'. Expected type \'object\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong interestPeriod type', () => {
            try {
                LatePaymentInterest.fromObject({
                    interestFreePeriod: {
                        value: 10,
                        unit: 'day',
                    },
                    interestPeriod: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse LatePaymentInterest parameter \'interestPeriod\'. Expected type \'object\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value has no interestRate', () => {
            try {
                LatePaymentInterest.fromObject({
                    interestFreePeriod: {
                        value: 10,
                        unit: 'month',
                    },
                    interestPeriod: {
                        value: 10,
                        unit: 'year',
                    },
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse LatePaymentInterest parameter \'interestRate\'. Expected type \'number\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong interestRate type', () => {
            try {
                LatePaymentInterest.fromObject({
                    interestFreePeriod: {
                        value: 10,
                        unit: 'day',
                    },
                    interestPeriod: {
                        value: 10,
                        unit: 'year',
                    },
                    interestRate: '12',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse LatePaymentInterest parameter \'interestRate\'. Expected type \'number\', but got \'12\' from type \'string\'.',
                });
            }
        });

        it('Value has no compoundInterest', () => {
            try {
                LatePaymentInterest.fromObject({
                    interestFreePeriod: {
                        value: 10,
                        unit: 'month',
                    },
                    interestPeriod: {
                        value: 10,
                        unit: 'year',
                    },
                    interestRate: 1.2,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse LatePaymentInterest parameter \'compoundInterest\'. Expected type \'boolean\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong compoundInterest type', () => {
            try {
                LatePaymentInterest.fromObject({
                    interestFreePeriod: {
                        value: 10,
                        unit: 'day',
                    },
                    interestPeriod: {
                        value: 10,
                        unit: 'year',
                    },
                    interestRate: 1.2,
                    compoundInterest: 'asdf',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse LatePaymentInterest parameter \'compoundInterest\'. Expected type \'boolean\', but got \'asdf\' from type \'string\'.',
                });
            }
        });

        it('Value valid', () => {
            const latePaymentInterest = LatePaymentInterest.fromObject({
                interestFreePeriod: {
                    value: 10,
                    unit: 'day',
                },
                interestPeriod: {
                    value: 10,
                    unit: 'year',
                },
                interestRate: 1.2,
                compoundInterest: true,
            }, logger.nextIndent);
            expect(latePaymentInterest).to.be.deep.equal(new LatePaymentInterest(
                new LatePaymentInterest.TimePeriod(10, 'day'),
                new LatePaymentInterest.TimePeriod(10, 'year'),
                1.2, true
            ));
        });
    });

    describe('PayedStateBuilder', () => {

        logger.append('PayedStateBuilder', undefined, 'info');

        it('Value no object', () => {
            try {
                PayedState.fromValue('asdf', logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse PayedState, expected type \'object\', but bot asdf from type \'string\'',
                });
            }
        });

        it('Value has no state', () => {
            try {
                PayedState.fromObject({}, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse PayedState parameter \'state\'. Expected values \'payed\', \'settled\' or \'unpayed\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has invalid state', () => {
            try {
                PayedState.fromObject({
                    state: 'invalid',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse PayedState parameter \'state\'. Expected values \'payed\', \'settled\' or \'unpayed\', but got \'invalid\' from type \'string\'.',
                });
            }
        });

        it('Value unpayed', () => {
            const payedState = PayedState.fromObject({
                state: 'unpayed',
            }, logger.nextIndent);
            expect(payedState).to.be.deep.equal(new PayedState({ state: 'unpayed' }));
        });

        it('Value settled', () => {
            const payedState = PayedState.fromObject({
                state: 'settled',
            }, logger.nextIndent);
            expect(payedState).to.be.deep.equal(new PayedState({ state: 'settled' }));
        });

        it('Value payed with no payDate', () => {
            try {
                PayedState.fromObject({
                    state: 'payed',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse PayedState parameter \'payDate\', expected iso string, but got \'undefined\' from type undefined',
                });
            }
        });

        it('Value payed with wrong payDate type', () => {
            try {
                PayedState.fromObject({
                    state: 'payed',
                    payDate: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse PayedState parameter \'payDate\', expected iso string, but got \'1234\' from type number',
                });
            }
        });

        it('Value payed with no inApp', () => {
            try {
                PayedState.fromObject({
                    state: 'payed',
                    payDate: '2011-10-14T10:42:38+0000',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse PayedState parameter \'inApp\'. Expected type \'boolean\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value payed with wrong inApp type', () => {
            try {
                PayedState.fromObject({
                    state: 'payed',
                    payDate: '2011-10-14T10:42:38+0000',
                    inApp: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse PayedState parameter \'inApp\'. Expected type \'boolean\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value valid payed', () => {
            const payedState = PayedState.fromObject({
                state: 'payed',
                payDate: '2011-10-14T10:42:38+0000',
                inApp: true,
            }, logger.nextIndent);
            expect(payedState).to.be.deep.equal(new PayedState({
                state: 'payed',
                inApp: true,
                payDate: new Date('2011-10-14T10:42:38+0000'),
            }));
        });
    });

    describe('PersonBuilder', () => {

        logger.append('PersonBuilder', undefined, 'info');

        it('Value no object', () => {
            try {
                Person.fromValue('asdf', logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse person, expected type \'object\', but bot asdf from type \'string\'',
                });
            }
        });

        it('Value has no id', () => {
            try {
                Person.fromObject({}, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse Person parameter \'id\'. Expected type \'string\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong id type', () => {
            try {
                Person.fromObject({
                    id: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse Person parameter \'id\'. Expected type \'string\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value has invalid id guid', () => {
            try {
                Person.fromObject({
                    id: 'invalid',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse Guid, guid string isn\'t a valid Guid: invalid',
                });
            }
        });

        it('Value has wrong deleted type', () => {
            try {
                Person.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    deleted: 'asdf',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse person, deleted argument wasn\'t from type boolean or was false.',
                });
            }
        });

        it('Value has deleted false', () => {
            try {
                Person.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    deleted: false,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse person, deleted argument wasn\'t from type boolean or was false.',
                });
            }
        });

        it('Value has deleted true', () => {
            const person = Person.fromObject({
                id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                deleted: true,
            }, logger.nextIndent);
            expect(person).to.be.deep
                .equal(new Deleted<guid>(guid.fromString('4ED90BA2-D536-4B2B-A93E-403987A056CC', logger.nextIndent)));
        });

        it('Value has no name', () => {
            try {
                Person.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse Person parameter \'name\'. Expected type \'object\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong id type', () => {
            try {
                Person.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    name: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse Person parameter \'name\'. Expected type \'object\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value valid', () => {
            const person = Person.fromObject({
                id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                name: {
                    first: 'asdf',
                    last: 'öjk',
                },
            }, logger.nextIndent);
            expect(person).to.be.deep.equal(new Person(
                guid.fromString('4ED90BA2-D536-4B2B-A93E-403987A056CC', logger.nextIndent),
                new PersonName('asdf', 'öjk'),
            ));
        });
    });

    describe('PersonNameBuilder', () => {

        logger.append('PersonNameBuilder', undefined, 'info');

        it('Value no object', () => {
            try {
                PersonName.fromValue('asdf', logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse PersonName, expected type \'object\', but bot asdf from type \'string\'',
                });
            }
        });

        it('Value has no firstName', () => {
            try {
                PersonName.fromObject({}, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse PersonName parameter \'first\'. Expected type \'string\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong firstName type', () => {
            try {
                PersonName.fromObject({
                    first: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse PersonName parameter \'first\'. Expected type \'string\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value has no lastName', () => {
            const personName = PersonName.fromObject({
                first: 'first name',
            }, logger.nextIndent);
            expect(personName).to.be.deep.equal(new PersonName('first name'));
        });

        it('Value has wrong lastName type', () => {
            try {
                PersonName.fromObject({
                    first: 'first name',
                    last: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse PersonName parameter \'last\'. Expected type \'string\' or undefined, but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value with lastName', () => {
            const personName = PersonName.fromObject({
                first: 'first name',
                last: 'last name',
            }, logger.nextIndent);
            expect(personName).to.be.deep.equal(new PersonName('first name', 'last name'));
        });
    });

    describe('PersonPropertiesWithIsAdmin', () => {

        logger.append('PersonPropertiesWithIsAdmin', undefined, 'info');

        it('Value no object', () => {
            try {
                PersonPropertiesWithIsAdmin.fromValue('asdf', logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse person properties, expected type \'object\', but bot asdf from type \'string\'',
                });
            }
        });

        it('Value has no id', () => {
            try {
                PersonPropertiesWithIsAdmin.fromObject({}, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse person properties parameter \'id\'. Expected type \'string\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong id type', () => {
            try {
                PersonPropertiesWithIsAdmin.fromObject({
                    id: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse person properties parameter \'id\'. Expected type \'string\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value has invalid id guid', () => {
            try {
                PersonPropertiesWithIsAdmin.fromObject({
                    id: 'invalid',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse Guid, guid string isn\'t a valid Guid: invalid',
                });
            }
        });

        it('Value has no signInDate', () => {
            try {
                PersonPropertiesWithIsAdmin.fromObject({
                    id: 'fd8f2af8-25bc-4eee-b4b7-b4206439395a',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse person properties parameter \'signInDate\'. Expected type \'string\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong signInDate type', () => {
            try {
                PersonPropertiesWithIsAdmin.fromObject({
                    id: 'fd8f2af8-25bc-4eee-b4b7-b4206439395a',
                    signInDate: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse person properties parameter \'signInDate\'. Expected type \'string\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value has no isAdmin', () => {
            try {
                PersonPropertiesWithIsAdmin.fromObject({
                    id: 'fd8f2af8-25bc-4eee-b4b7-b4206439395a',
                    signInDate: '2011-10-14T10:42:38+0000',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse person properties parameter \'isAdmin\'. Expected type \'boolean\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong isAdmin type', () => {
            try {
                PersonPropertiesWithIsAdmin.fromObject({
                    id: 'fd8f2af8-25bc-4eee-b4b7-b4206439395a',
                    signInDate: '2011-10-14T10:42:38+0000',
                    isAdmin: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse person properties parameter \'isAdmin\'. Expected type \'boolean\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value has no name', () => {
            try {
                PersonPropertiesWithIsAdmin.fromObject({
                    id: 'fd8f2af8-25bc-4eee-b4b7-b4206439395a',
                    signInDate: '2011-10-14T10:42:38+0000',
                    isAdmin: true,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse person properties parameter \'name\'. Expected type \'object\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong name type', () => {
            try {
                PersonPropertiesWithIsAdmin.fromObject({
                    id: 'fd8f2af8-25bc-4eee-b4b7-b4206439395a',
                    signInDate: '2011-10-14T10:42:38+0000',
                    isAdmin: true,
                    name: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse person properties parameter \'name\'. Expected type \'object\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value valid', () => {
            const personProperties = PersonPropertiesWithIsAdmin.fromObject({
                id: 'fd8f2af8-25bc-4eee-b4b7-b4206439395a',
                signInDate: '2011-10-14T10:42:38+0000',
                isAdmin: true,
                name: {
                    first: 'asdf',
                },
            }, logger.nextIndent);
            expect(personProperties).to.be.deep.equal(new PersonPropertiesWithIsAdmin(
                guid.fromString('fd8f2af8-25bc-4eee-b4b7-b4206439395a', logger.nextIndent),
                new Date('2011-10-14T10:42:38+0000'), true,
                new PersonName('asdf')
            ));
        });
    });

    describe('PersonPropertiesWithUserIdBuilder', () => {

        logger.append('PersonPropertiesWithUserIdBuilder', undefined, 'info');

        it('Value no object', () => {
            try {
                PersonPropertiesWithUserId.fromValue('asdf', logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse person properties, expected type \'object\', but bot asdf from type \'string\'',
                });
            }
        });

        it('Value has no id', () => {
            try {
                PersonPropertiesWithUserId.fromObject({}, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse person properties parameter \'id\'. Expected type \'string\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong id type', () => {
            try {
                PersonPropertiesWithUserId.fromObject({
                    id: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse person properties parameter \'id\'. Expected type \'string\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value has invalid id guid', () => {
            try {
                PersonPropertiesWithUserId.fromObject({
                    id: 'invalid',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse Guid, guid string isn\'t a valid Guid: invalid',
                });
            }
        });

        it('Value has no signInDate', () => {
            try {
                PersonPropertiesWithUserId.fromObject({
                    id: 'fd8f2af8-25bc-4eee-b4b7-b4206439395a',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse person properties parameter \'signInDate\'. Expected type \'string\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong signInDate type', () => {
            try {
                PersonPropertiesWithUserId.fromObject({
                    id: 'fd8f2af8-25bc-4eee-b4b7-b4206439395a',
                    signInDate: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse person properties parameter \'signInDate\'. Expected type \'string\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value has no userId', () => {
            try {
                PersonPropertiesWithUserId.fromObject({
                    id: 'fd8f2af8-25bc-4eee-b4b7-b4206439395a',
                    signInDate: '2011-10-14T10:42:38+0000',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse person properties parameter \'userId\'. Expected type \'string\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong userId type', () => {
            try {
                PersonPropertiesWithUserId.fromObject({
                    id: 'fd8f2af8-25bc-4eee-b4b7-b4206439395a',
                    signInDate: '2011-10-14T10:42:38+0000',
                    userId: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse person properties parameter \'userId\'. Expected type \'string\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value has no name', () => {
            try {
                PersonPropertiesWithUserId.fromObject({
                    id: 'fd8f2af8-25bc-4eee-b4b7-b4206439395a',
                    signInDate: '2011-10-14T10:42:38+0000',
                    userId: 'lkjnm',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse person properties parameter \'name\'. Expected type \'object\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong name type', () => {
            try {
                PersonPropertiesWithUserId.fromObject({
                    id: 'fd8f2af8-25bc-4eee-b4b7-b4206439395a',
                    signInDate: '2011-10-14T10:42:38+0000',
                    userId: 'lkjnm',
                    name: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse person properties parameter \'name\'. Expected type \'object\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value valid', () => {
            const personProperties = PersonPropertiesWithUserId.fromObject({
                id: 'fd8f2af8-25bc-4eee-b4b7-b4206439395a',
                signInDate: '2011-10-14T10:42:38+0000',
                userId: 'lkjnm',
                name: {
                    first: 'asdf',
                },
            }, logger.nextIndent);
            expect(personProperties).to.be.deep.equal(new PersonPropertiesWithUserId(
                guid.fromString('fd8f2af8-25bc-4eee-b4b7-b4206439395a', logger.nextIndent),
                new Date('2011-10-14T10:42:38+0000'), 'lkjnm',
                new PersonName('asdf')
            ));
        });
    });

    describe('ReasonTemplateBuilder', () => {

        logger.append('ReasonTemplateBuilder', undefined, 'info');

        it('Value no object', () => {
            try {
                ReasonTemplate.fromValue('asdf', logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse ReasonTemplate, expected type \'object\', but bot asdf from type \'string\'',
                });
            }
        });

        it('Value has no id', () => {
            try {
                ReasonTemplate.fromObject({}, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse ReasonTemplate parameter \'id\'. Expected type \'string\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong id type', () => {
            try {
                ReasonTemplate.fromObject({
                    id: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse ReasonTemplate parameter \'id\'. Expected type \'string\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value has invalid id guid', () => {
            try {
                ReasonTemplate.fromObject({
                    id: 'invalid',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse Guid, guid string isn\'t a valid Guid: invalid',
                });
            }
        });

        it('Value has wrong deleted type', () => {
            try {
                ReasonTemplate.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    deleted: 'asdf',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse ReasonTemplate, deleted argument wasn\'t from type boolean or was false.',
                });
            }
        });

        it('Value has deleted false', () => {
            try {
                ReasonTemplate.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    deleted: false,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    message: 'Couldn\'t parse ReasonTemplate, deleted argument wasn\'t from type boolean or was false.',
                });
            }
        });

        it('Value has deleted true', () => {
            const reasonTemplate = ReasonTemplate.fromObject({
                id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                deleted: true,
            }, logger.nextIndent);
            expect(reasonTemplate).to.be.deep
                .equal(new Deleted<guid>(guid.fromString('4ED90BA2-D536-4B2B-A93E-403987A056CC', logger.nextIndent)));
        });

        it('Value has no reason', () => {
            try {
                ReasonTemplate.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse ReasonTemplate parameter \'reasonMessage\'. Expected type \'string\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong reason type', () => {
            try {
                ReasonTemplate.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    reasonMessage: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse ReasonTemplate parameter \'reasonMessage\'. Expected type \'string\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value has no amount', () => {
            try {
                ReasonTemplate.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    reasonMessage: 'asdf',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse ReasonTemplate parameter \'amount\'. Expected type \'number\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong amount type', () => {
            try {
                ReasonTemplate.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    reasonMessage: 'asdf',
                    amount: 'asdf',
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse ReasonTemplate parameter \'amount\'. Expected type \'number\', but got \'asdf\' from type \'string\'.',
                });
            }
        });

        it('Value has no importance', () => {
            try {
                ReasonTemplate.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    reasonMessage: 'asdf',
                    amount: 12.50,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse ReasonTemplate parameter \'importance\'. Expected type \'string\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Value has wrong importance type', () => {
            try {
                ReasonTemplate.fromObject({
                    id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                    reasonMessage: 'asdf',
                    amount: 12.50,
                    importance: 1234,
                }, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse ReasonTemplate parameter \'importance\'. Expected type \'string\', but got \'1234\' from type \'number\'.',
                });
            }
        });

        it('Value valid', () => {
            const reasonTemplate = ReasonTemplate.fromObject({
                id: '4ED90BA2-D536-4B2B-A93E-403987A056CC',
                reasonMessage: 'asdf',
                amount: 12.50,
                importance: 'high',
            }, logger.nextIndent);
            expect(reasonTemplate).to.be.deep.equal(new ReasonTemplate(
                guid.fromString('4ED90BA2-D536-4B2B-A93E-403987A056CC', logger.nextIndent),
                'asdf', new Amount(12, 50), new Importance('high')
            ));
        });
    });

    describe('UpdatableBuilder', () => {

        logger.append('UpdatableBuilder', undefined, 'info');

        it('Property builder failed', () => {
            try {
                const timestamp = new Date().toISOString();
                const personId = guid.newGuid().guidString;
                Updatable.fromRawProperty({
                    updateProperties: { timestamp, personId },
                }, ReasonTemplate.fromObject, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse ReasonTemplate parameter \'id\'. Expected type \'string\', but got \'undefined\' from type \'undefined\'.',
                });
            }
        });

        it('Update property no timestamp', () => {
            try {
                const personId = guid.newGuid().guidString;
                Updatable.fromRawProperty({
                    id: guid.newGuid().guidString,
                    reasonMessage: 'test',
                    amount: 10.50,
                    importance: 'high',
                    updateProperties: { personId },
                }, ReasonTemplate.fromObject, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse UpdateProperties parameter \'timestamp\', expected iso string but got \'undefined\' from type undefined',
                });
            }
        });

        it('Update property invalid timestamp type', () => {
            try {
                const personId = guid.newGuid().guidString;
                const timestamp = 123;
                Updatable.fromRawProperty({
                    id: guid.newGuid().guidString,
                    reasonMessage: 'test',
                    amount: 10.50,
                    importance: 'high',
                    updateProperties: { personId, timestamp },
                }, ReasonTemplate.fromObject, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse UpdateProperties parameter \'timestamp\', expected iso string but got \'123\' from type number',
                });
            }
        });

        it('Update property no personId', () => {
            try {
                const timestamp = new Date().toISOString();
                Updatable.fromRawProperty({
                    id: guid.newGuid().guidString,
                    reasonMessage: 'test',
                    amount: 10.50,
                    importance: 'high',
                    updateProperties: { timestamp },
                }, ReasonTemplate.fromObject, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse UpdateProperties parameter \'personId\', expected type string but got \'undefined\' from type undefined',
                });
            }
        });

        it('Update property invalid personId type', () => {
            try {
                const personId = { id: guid.newGuid().guidString };
                const timestamp = new Date().toISOString();
                Updatable.fromRawProperty({
                    id: guid.newGuid().guidString,
                    reasonMessage: 'test',
                    amount: 10.50,
                    importance: 'high',
                    updateProperties: { personId, timestamp },
                }, ReasonTemplate.fromObject, logger.nextIndent);
                assert.fail('A statement above should throw an exception.');
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: 'invalid-argument',
                    // eslint-disable-next-line max-len
                    message: 'Couldn\'t parse UpdateProperties parameter \'personId\', expected type string but got \'[object Object]\' from type object',
                });
            }
        });

        it('Update property valid', () => {
            const reasonId = guid.newGuid();
            const personId = guid.newGuid();
            const timestamp = new Date();
            const updatable = Updatable.fromRawProperty({
                id: reasonId.guidString,
                reasonMessage: 'test',
                amount: 10.50,
                importance: 'high',
                updateProperties: {
                    personId: personId.guidString,
                    timestamp: timestamp.toISOString(),
                },
            }, ReasonTemplate.fromObject, logger.nextIndent);
            expect(updatable).to.be.deep.equal({
                property: {
                    amount: {
                        subUnitValue: 50,
                        value: 10,
                    },
                    id: reasonId,
                    importance: {
                        value: 'high',
                    },
                    reasonMessage: 'test',
                },
                updateProperties: {
                    personId: personId,
                    timestamp: timestamp,
                },
            });
        });
    });
});
