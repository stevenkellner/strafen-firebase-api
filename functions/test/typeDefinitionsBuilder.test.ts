import { assert, expect } from "chai";
import { Amount } from "../src/TypeDefinitions/Amount";
import { ChangeType } from "../src/TypeDefinitions/ChangeType";
import { ClubLevel } from "../src/TypeDefinitions/ClubLevel";
import { ClubProperties } from "../src/TypeDefinitions/ClubProperties";
import { Fine } from "../src/TypeDefinitions/Fine";
import { FineReason } from "../src/TypeDefinitions/FineReason";
import { guid } from "../src/TypeDefinitions/guid";
import { Importance } from "../src/TypeDefinitions/Importance";
import { LatePaymentInterest } from "../src/TypeDefinitions/LatePaymentInterest";
import { LoggingProperties } from "../src/TypeDefinitions/LoggingProperties";
import { ParameterContainer } from "../src/TypeDefinitions/ParameterContainer";
import { PayedState } from "../src/TypeDefinitions/PayedState";
import { Person } from "../src/TypeDefinitions/Person";
import { PersonName } from "../src/TypeDefinitions/PersonName";
import { PersonPropertiesWithIsCashier } from "../src/TypeDefinitions/PersonPropertiesWithIsCashier";
import { PersonPropertiesWithUserId } from "../src/TypeDefinitions/PersonPropertiesWithUserId";
import { ReasonTemplate } from "../src/TypeDefinitions/ReasonTemplate";
import { Updatable, UpdateProperties } from "../src/TypeDefinitions/UpdateProperties";
import { Deleted } from "../src/utils";
import { errorCodeAndMessage } from "./utils";

describe("TypeDefinitionsBuilder", () => {

    const loggingProperties = LoggingProperties.withFirst(new ParameterContainer({verbose: true}), "typeDefinitionsBuilderTest", undefined, "notice");

    describe("AmountBuilder", () => {

        loggingProperties.append("AmountBuilder", undefined, "info");

        it("Value no number", () => {
            try {
                new Amount.Builder().fromValue("12.50", loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse amount, expected type 'number', but bot 12.50 from type 'string'",
                });
            }
        });

        it("Value negative number", () => {
            try {
                new Amount.Builder().fromValue(-10, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse Amount since value is negative.",
                });
            }
        });

        it("Value zero number", () => {
            const amount = new Amount.Builder().fromValue(0, loggingProperties.nextIndent);
            expect(amount).to.be.deep.equal(new Amount(0, 0));
        });

        it("Value large subunit value", () => {
            const amount = new Amount.Builder().fromValue(1.298, loggingProperties.nextIndent);
            expect(amount).to.be.deep.equal(new Amount(1, 29));
        });

        it("Value no subunit value", () => {
            const amount = new Amount.Builder().fromValue(34, loggingProperties.nextIndent);
            expect(amount).to.be.deep.equal(new Amount(34, 0));
        });
    });

    describe("ChangeTypeBuilder", () => {

        loggingProperties.append("ChangeTypeBuilder", undefined, "info");

        it("Value no string", () => {
            try {
                new ChangeType.Builder().fromValue(["asdf"], loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse ChangeType, expected type 'string', but bot asdf from type 'object'",
                });
            }
        });

        it("Invalid value", () => {
            try {
                new ChangeType.Builder().fromValue("invalid", loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse ChangeType, expected 'delete' or 'update', but got invalid instead.",
                });
            }
        });

        it("Value update", () => {
            const changeType = new ChangeType.Builder().fromValue("update", loggingProperties.nextIndent);
            expect(changeType).to.be.deep.equal(new ChangeType("update"));
        });

        it("Value delete", () => {
            const changeType = new ChangeType.Builder().fromValue("delete", loggingProperties.nextIndent);
            expect(changeType).to.be.deep.equal(new ChangeType("delete"));
        });
    });

    describe("ClubLevelBuilder", () => {

        loggingProperties.append("ClubLevelBuilder", undefined, "info");

        it("Value no string", () => {
            try {
                new ClubLevel.Builder().fromValue(["asdf"], loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse ClubLevel, expected type 'string', but bot asdf from type 'object'",
                });
            }
        });

        it("Invalid value", () => {
            try {
                new ClubLevel.Builder().fromValue("invalid", loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse ClubLevel, expected 'regular', 'debug' or 'testing', but got invalid instead.",
                });
            }
        });

        it("Value regular", () => {
            const clubLevel = new ClubLevel.Builder().fromValue("regular", loggingProperties.nextIndent);
            expect(clubLevel).to.be.deep.equal(new ClubLevel("regular"));
        });

        it("Value debug", () => {
            const clubLevel = new ClubLevel.Builder().fromValue("debug", loggingProperties.nextIndent);
            expect(clubLevel).to.be.deep.equal(new ClubLevel("debug"));
        });

        it("Value testing", () => {
            const clubLevel = new ClubLevel.Builder().fromValue("testing", loggingProperties.nextIndent);
            expect(clubLevel).to.be.deep.equal(new ClubLevel("testing"));
        });
    });

    describe("ClubPropertiesBuilder", () => {

        loggingProperties.append("ClubPropertiesBuilder", undefined, "info");

        it("Value no object", () => {
            try {
                new ClubProperties.Builder().fromValue("asdf", loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse club properties, expected type 'object', but bot asdf from type 'string'",
                });
            }
        });

        it("Value has no id", () => {
            try {
                new ClubProperties.Builder().fromValue({}, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse club properties parameter 'id'. Expected type 'string', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong id type", () => {
            try {
                new ClubProperties.Builder().fromValue({
                    id: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse club properties parameter 'id'. Expected type 'string', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value has invalid id guid", () => {
            try {
                new ClubProperties.Builder().fromValue({
                    id: "invalid",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse Guid, guid string isn't a valid Guid: invalid",
                });
            }
        });

        it("Value has no name", () => {
            try {
                new ClubProperties.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse club properties parameter 'name'. Expected type 'string', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong name type", () => {
            try {
                new ClubProperties.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    name: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse club properties parameter 'name'. Expected type 'string', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value has no identifier", () => {
            try {
                new ClubProperties.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    name: "my name",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse club properties parameter 'identifier'. Expected type 'string', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong identifier type", () => {
            try {
                new ClubProperties.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    name: "my name",
                    identifier: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse club properties parameter 'identifier'. Expected type 'string', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value has no regionCode", () => {
            try {
                new ClubProperties.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    name: "my name",
                    identifier: "my id",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse club properties parameter 'regionCode'. Expected type 'string', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong regionCode type", () => {
            try {
                new ClubProperties.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    name: "my name",
                    identifier: "my id",
                    regionCode: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse club properties parameter 'regionCode'. Expected type 'string', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value has no inAppPaymentActive", () => {
            try {
                new ClubProperties.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    name: "my name",
                    identifier: "my id",
                    regionCode: "my rc",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse club properties parameter 'inAppPaymentActive'. Expected type 'boolean', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong inAppPaymentActive type", () => {
            try {
                new ClubProperties.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    name: "my name",
                    identifier: "my id",
                    regionCode: "my rc",
                    inAppPaymentActive: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse club properties parameter 'inAppPaymentActive'. Expected type 'boolean', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value valid", () => {
            const clubProperties = new ClubProperties.Builder().fromValue({
                id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                name: "my name",
                identifier: "my id",
                regionCode: "my rc",
                inAppPaymentActive: true,
            }, loggingProperties.nextIndent);
            expect(clubProperties).to.be.deep.equal(new ClubProperties(
                guid.fromString("4ED90BA2-D536-4B2B-A93E-403987A056CC", loggingProperties.nextIndent),
                "my name", "my id", "my rc", true
            ));
        });
    });

    describe("FineBuilder", () => {

        loggingProperties.append("FineBuilder", undefined, "info");

        it("Value no object", () => {
            try {
                new Fine.Builder().fromValue("asdf", loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine, expected type 'object', but bot asdf from type 'string'",
                });
            }
        });

        it("Value has no id", () => {
            try {
                new Fine.Builder().fromValue({}, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine parameter 'id', expected type string but got 'undefined' from type undefined",
                });
            }
        });

        it("Value has wrong id type", () => {
            try {
                new Fine.Builder().fromValue({
                    id: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine parameter 'id', expected type string but got '1234' from type number",
                });
            }
        });

        it("Value has invalid id guid", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "invalid",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse Guid, guid string isn't a valid Guid: invalid",
                });
            }
        });

        it("Value has wrong deleted type", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    deleted: "asdf",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine, deleted argument wasn't from type boolean or was false.",
                });
            }
        });

        it("Value has deleted false", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    deleted: false,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine, deleted argument wasn't from type boolean or was false.",
                });
            }
        });

        it("Value has deleted true", () => {
            const fine = new Fine.Builder().fromValue({
                id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                deleted: true,
            }, loggingProperties.nextIndent);
            expect(fine).to.be.deep.equal(new Deleted<guid>(guid.fromString("4ED90BA2-D536-4B2B-A93E-403987A056CC", loggingProperties.nextIndent)));
        });

        it("Value has no person id", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine parameter 'personId', expected type string but got 'undefined' from type undefined",
                });
            }
        });

        it("Value has wrong person id type", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    personId: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine parameter 'personId', expected type string but got '1234' from type number",
                });
            }
        });

        it("Value has invalid person id guid", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    personId: "invalid",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse Guid, guid string isn't a valid Guid: invalid",
                });
            }
        });

        it("Value has no payed state", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    personId: "d3373dc9-099d-413b-bc4d-d921b2b27d29",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine parameter 'payedState', expected type object but got 'undefined' from type undefined",
                });
            }
        });

        it("Value has wrong payed state type", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    personId: "d3373dc9-099d-413b-bc4d-d921b2b27d29",
                    payedState: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine parameter 'payedState', expected type object but got '1234' from type number",
                });
            }
        });

        it("Value payed state with out update properties", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    personId: "d3373dc9-099d-413b-bc4d-d921b2b27d29",
                    payedState: {
                        state: "unpayed",
                    },
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't get updateProperties.",
                });
            }
        });

        it("Value has no number", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    personId: "d3373dc9-099d-413b-bc4d-d921b2b27d29",
                    payedState: {
                        state: "settled",
                        updateProperties: {
                            timestamp: "2011-10-16T10:42:38+0000",
                            personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                        },
                    },
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine parameter 'number', expected unsigned integer greater zero but got 'undefined' from type undefined",
                });
            }
        });

        it("Value has wrong number type", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    personId: "d3373dc9-099d-413b-bc4d-d921b2b27d29",
                    payedState: {
                        state: "settled",
                        updateProperties: {
                            timestamp: "2011-10-16T10:42:38+0000",
                            personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                        },
                    },
                    number: "1234",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine parameter 'number', expected unsigned integer greater zero but got '1234' from type string",
                });
            }
        });

        it("Value has negative number", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    personId: "d3373dc9-099d-413b-bc4d-d921b2b27d29",
                    payedState: {
                        state: "settled",
                        updateProperties: {
                            timestamp: "2011-10-16T10:42:38+0000",
                            personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                        },
                    },
                    number: -12,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine parameter 'number', expected unsigned integer greater zero but got '-12' from type number",
                });
            }
        });

        it("Value has zero number", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    personId: "d3373dc9-099d-413b-bc4d-d921b2b27d29",
                    payedState: {
                        state: "settled",
                        updateProperties: {
                            timestamp: "2011-10-16T10:42:38+0000",
                            personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                        },
                    },
                    number: 0,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine parameter 'number', expected unsigned integer greater zero but got '0' from type number",
                });
            }
        });

        it("Value has decimal number", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    personId: "d3373dc9-099d-413b-bc4d-d921b2b27d29",
                    payedState: {
                        state: "settled",
                        updateProperties: {
                            timestamp: "2011-10-16T10:42:38+0000",
                            personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                        },
                    },
                    number: 1.5,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine parameter 'number', expected unsigned integer greater zero but got '1.5' from type number",
                });
            }
        });

        it("Value has no date", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    personId: "d3373dc9-099d-413b-bc4d-d921b2b27d29",
                    payedState: {
                        state: "settled",
                        updateProperties: {
                            timestamp: "2011-10-16T10:42:38+0000",
                            personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                        },
                    },
                    number: 1,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine parameter 'date', expected iso string but got 'undefined' from type undefined",
                });
            }
        });

        it("Value has wrong date type", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    personId: "d3373dc9-099d-413b-bc4d-d921b2b27d29",
                    payedState: {
                        state: "settled",
                        updateProperties: {
                            timestamp: "2011-10-16T10:42:38+0000",
                            personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                        },
                    },
                    number: 1,
                    date: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine parameter 'date', expected iso string but got '1234' from type number",
                });
            }
        });

        it("Value has invalid date format", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    personId: "d3373dc9-099d-413b-bc4d-d921b2b27d29",
                    payedState: {
                        state: "settled",
                        updateProperties: {
                            timestamp: "2011-10-16T10:42:38+0000",
                            personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                        },
                    },
                    number: 1,
                    date: "invalid",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine parameter 'date', expected iso string but got 'invalid' from type string",
                });
            }
        });

        it("Value has no fine reason", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    personId: "d3373dc9-099d-413b-bc4d-d921b2b27d29",
                    payedState: {
                        state: "settled",
                        updateProperties: {
                            timestamp: "2011-10-16T10:42:38+0000",
                            personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                        },
                    },
                    number: 1,
                    date: "2011-10-16T10:42:38+0000",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine parameter 'fineReason', expected type object but got 'undefined' from type undefined",
                });
            }
        });

        it("Value has wrong fine reason type", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    personId: "d3373dc9-099d-413b-bc4d-d921b2b27d29",
                    payedState: {
                        state: "settled",
                        updateProperties: {
                            timestamp: "2011-10-16T10:42:38+0000",
                            personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                        },
                    },
                    number: 1,
                    date: "2011-10-16T10:42:38+0000",
                    fineReason: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine parameter 'fineReason', expected type object but got '1234' from type number",
                });
            }
        });

        it("Value has invalid fine reason", () => {
            try {
                new Fine.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    personId: "d3373dc9-099d-413b-bc4d-d921b2b27d29",
                    payedState: {
                        state: "settled",
                        updateProperties: {
                            timestamp: "2011-10-16T10:42:38+0000",
                            personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                        },
                    },
                    number: 1,
                    date: "2011-10-16T10:42:38+0000",
                    fineReason: {},
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine reason, no fine reason with reason template id and no custom fine reason given, got instead: {}",
                });
            }
        });

        it("Value valid", () => {
            const fine = new Fine.Builder().fromValue({
                id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                personId: "d3373dc9-099d-413b-bc4d-d921b2b27d29",
                payedState: {
                    state: "settled",
                    updateProperties: {
                        timestamp: "2011-10-16T10:42:38+0000",
                        personId: "7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7",
                    },
                },
                number: 1,
                date: "2011-10-16T10:42:38+0000",
                fineReason: {
                    reasonTemplateId: "9bfe9e0a-2e3f-48c3-b2a9-5c637497fd81",
                },
            }, loggingProperties.nextIndent);
            expect(fine).to.be.deep.equal(new Fine(
                guid.fromString("4ED90BA2-D536-4B2B-A93E-403987A056CC", loggingProperties.nextIndent),
                guid.fromString("d3373dc9-099d-413b-bc4d-d921b2b27d29", loggingProperties.nextIndent),
                new Updatable(new PayedState({
                    state: "settled",
                }),
                new UpdateProperties(
                    new Date("2011-10-16T10:42:38+0000"),
                    guid.fromString("7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7", loggingProperties.nextIndent)
                )),
                1, new Date("2011-10-16T10:42:38+0000"),
                new FineReason({
                    reasonTemplateId: guid.fromString("9bfe9e0a-2e3f-48c3-b2a9-5c637497fd81", loggingProperties.nextIndent),
                })
            ));
        });
    });

    describe("FineReasonBuilder", () => {

        loggingProperties.append("FineReasonBuilder", undefined, "info");

        it("Value no object", () => {
            try {
                new FineReason.Builder().fromValue("asdf", loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse FineReason, expected type 'object', but bot asdf from type 'string'",
                });
            }
        });

        it("Both custom and template properties", () => {
            const fineReason = new FineReason.Builder().fromValue({
                reasonTemplateId: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                reason: "asdf",
                amount: 12.50,
                importance: "low",
            }, loggingProperties.nextIndent);
            expect(fineReason).to.be.deep.equal(new FineReason({
                reasonTemplateId: guid.fromString("4ED90BA2-D536-4B2B-A93E-403987A056CC", loggingProperties.nextIndent),
            }));
        });

        it("With template id", () => {
            const fineReason = new FineReason.Builder().fromValue({
                reasonTemplateId: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
            }, loggingProperties.nextIndent);
            expect(fineReason).to.be.deep.equal(new FineReason({
                reasonTemplateId: guid.fromString("4ED90BA2-D536-4B2B-A93E-403987A056CC", loggingProperties.nextIndent),
            }));
        });

        it("With custom", () => {
            const fineReason = new FineReason.Builder().fromValue({
                reason: "asdf",
                amount: 12.50,
                importance: "low",
            }, loggingProperties.nextIndent);
            expect(fineReason).to.be.deep.equal(new FineReason(new FineReason.WithCustom(
                "asdf", new Amount(12, 50), new Importance("low"),
            )));
        });

        it("Value invalid", () => {
            try {
                new FineReason.Builder().fromValue({
                    reason: "asdf",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse fine reason, no fine reason with reason template id and no custom fine reason given, got instead: {\"reason\":\"asdf\"}",
                });
            }
        });
    });

    describe("ImportanceBuilder", () => {

        loggingProperties.append("ImportanceBuilder", undefined, "info");

        it("Value no string", () => {
            try {
                new Importance.Builder().fromValue(["asdf"], loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse Importance, expected type 'string', but bot asdf from type 'object'",
                });
            }
        });

        it("Invalid value", () => {
            try {
                new Importance.Builder().fromValue("invalid", loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse Importance, expected 'high', 'medium' or 'low', but got invalid instead.",
                });
            }
        });

        it("Value high", () => {
            const importance = new Importance.Builder().fromValue("high", loggingProperties.nextIndent);
            expect(importance).to.be.deep.equal(new Importance("high"));
        });

        it("Value medium", () => {
            const importance = new Importance.Builder().fromValue("medium", loggingProperties.nextIndent);
            expect(importance).to.be.deep.equal(new Importance("medium"));
        });

        it("Value low", () => {
            const importance = new Importance.Builder().fromValue("low", loggingProperties.nextIndent);
            expect(importance).to.be.deep.equal(new Importance("low"));
        });
    });

    describe("LatePaymentInterestBuilder", () => {

        loggingProperties.append("LatePaymentInterestBuilder", undefined, "info");

        it("Value no object", () => {
            try {
                new LatePaymentInterest.Builder().fromValue("asdf", loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse LatePaymentInterest, expected type 'object', but bot asdf from type 'string'",
                });
            }
        });

        it("Value has wrong deleted type", () => {
            try {
                new LatePaymentInterest.Builder().fromValue({
                    deleted: "asdf",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse interest, deleted argument wasn't from type boolean or was false.",
                });
            }
        });

        it("Value has deleted false", () => {
            try {
                new LatePaymentInterest.Builder().fromValue({
                    deleted: false,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse interest, deleted argument wasn't from type boolean or was false.",
                });
            }
        });

        it("Value has deleted true", () => {
            const latePaymentInterest = new LatePaymentInterest.Builder().fromValue({
                deleted: true,
            }, loggingProperties.nextIndent);
            expect(latePaymentInterest).to.be.deep.equal(new Deleted<null>(null));
        });

        it("Value has no interestFreePeriod", () => {
            try {
                new LatePaymentInterest.Builder().fromValue({}, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse LatePaymentInterest parameter 'interestFreePeriod'. Expected type 'object', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong interestFreePeriod type", () => {
            try {
                new LatePaymentInterest.Builder().fromValue({
                    interestFreePeriod: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse LatePaymentInterest parameter 'interestFreePeriod'. Expected type 'object', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value has interestFreePeriod with no value", () => {
            try {
                new LatePaymentInterest.Builder().fromValue({
                    interestFreePeriod: {},
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse TimePeriod parameter 'value'. Expected type 'number', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has interestFreePeriod with wrong value type", () => {
            try {
                new LatePaymentInterest.Builder().fromValue({
                    interestFreePeriod: {
                        value: "1234",
                    },
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse TimePeriod parameter 'value'. Expected type 'number', but got '1234' from type 'string'.",
                });
            }
        });

        it("Value has interestFreePeriod with no unit", () => {
            try {
                new LatePaymentInterest.Builder().fromValue({
                    interestFreePeriod: {
                        value: 1234,
                    },
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse TimePeriod parameter 'unit'. Expected 'day', 'month' or 'year' from type 'string', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has interestFreePeriod with wrong unit type", () => {
            try {
                new LatePaymentInterest.Builder().fromValue({
                    interestFreePeriod: {
                        value: 1234,
                        unit: 12,
                    },
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse TimePeriod parameter 'unit'. Expected 'day', 'month' or 'year' from type 'string', but got '12' from type 'number'.",
                });
            }
        });

        it("Value has interestFreePeriod with invalid unit", () => {
            try {
                new LatePaymentInterest.Builder().fromValue({
                    interestFreePeriod: {
                        value: 1234,
                        unit: "invalid",
                    },
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse TimePeriod parameter 'unit'. Expected 'day', 'month' or 'year' from type 'string', but got 'invalid' from type 'string'.",
                });
            }
        });

        it("Value has no interestPeriod", () => {
            try {
                new LatePaymentInterest.Builder().fromValue({
                    interestFreePeriod: {
                        value: 10,
                        unit: "month",
                    },
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse LatePaymentInterest parameter 'interestPeriod'. Expected type 'object', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong interestPeriod type", () => {
            try {
                new LatePaymentInterest.Builder().fromValue({
                    interestFreePeriod: {
                        value: 10,
                        unit: "day",
                    },
                    interestPeriod: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse LatePaymentInterest parameter 'interestPeriod'. Expected type 'object', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value has no interestRate", () => {
            try {
                new LatePaymentInterest.Builder().fromValue({
                    interestFreePeriod: {
                        value: 10,
                        unit: "month",
                    },
                    interestPeriod: {
                        value: 10,
                        unit: "year",
                    },
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse LatePaymentInterest parameter 'interestRate'. Expected type 'number', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong interestRate type", () => {
            try {
                new LatePaymentInterest.Builder().fromValue({
                    interestFreePeriod: {
                        value: 10,
                        unit: "day",
                    },
                    interestPeriod: {
                        value: 10,
                        unit: "year",
                    },
                    interestRate: "12",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse LatePaymentInterest parameter 'interestRate'. Expected type 'number', but got '12' from type 'string'.",
                });
            }
        });

        it("Value has no compoundInterest", () => {
            try {
                new LatePaymentInterest.Builder().fromValue({
                    interestFreePeriod: {
                        value: 10,
                        unit: "month",
                    },
                    interestPeriod: {
                        value: 10,
                        unit: "year",
                    },
                    interestRate: 1.2,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse LatePaymentInterest parameter 'compoundInterest'. Expected type 'boolean', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong compoundInterest type", () => {
            try {
                new LatePaymentInterest.Builder().fromValue({
                    interestFreePeriod: {
                        value: 10,
                        unit: "day",
                    },
                    interestPeriod: {
                        value: 10,
                        unit: "year",
                    },
                    interestRate: 1.2,
                    compoundInterest: "asdf",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse LatePaymentInterest parameter 'compoundInterest'. Expected type 'boolean', but got 'asdf' from type 'string'.",
                });
            }
        });

        it("Value valid", () => {
            const latePaymentInterest = new LatePaymentInterest.Builder().fromValue({
                interestFreePeriod: {
                    value: 10,
                    unit: "day",
                },
                interestPeriod: {
                    value: 10,
                    unit: "year",
                },
                interestRate: 1.2,
                compoundInterest: true,
            }, loggingProperties.nextIndent);
            expect(latePaymentInterest).to.be.deep.equal(new LatePaymentInterest(
                new LatePaymentInterest.TimePeriod(10, "day"),
                new LatePaymentInterest.TimePeriod(10, "year"),
                1.2, true
            ));
        });
    });

    describe("PayedStateBuilder", () => {

        loggingProperties.append("PayedStateBuilder", undefined, "info");

        it("Value no object", () => {
            try {
                new PayedState.Builder().fromValue("asdf", loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse PayedState, expected type 'object', but bot asdf from type 'string'",
                });
            }
        });

        it("Value has no state", () => {
            try {
                new PayedState.Builder().fromValue({}, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse PayedState parameter 'state'. Expected values 'payed', 'settled' or 'unpayed', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has invalid state", () => {
            try {
                new PayedState.Builder().fromValue({
                    state: "invalid",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse PayedState parameter 'state'. Expected values 'payed', 'settled' or 'unpayed', but got 'invalid' from type 'string'.",
                });
            }
        });

        it("Value unpayed", () => {
            const payedState = new PayedState.Builder().fromValue({
                state: "unpayed",
            }, loggingProperties.nextIndent);
            expect(payedState).to.be.deep.equal(new PayedState({state: "unpayed"}));
        });

        it("Value settled", () => {
            const payedState = new PayedState.Builder().fromValue({
                state: "settled",
            }, loggingProperties.nextIndent);
            expect(payedState).to.be.deep.equal(new PayedState({state: "settled"}));
        });

        it("Value payed with no payDate", () => {
            try {
                new PayedState.Builder().fromValue({
                    state: "payed",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse PayedState parameter 'payDate', expected iso string, but got 'undefined' from type undefined",
                });
            }
        });

        it("Value payed with wrong payDate type", () => {
            try {
                new PayedState.Builder().fromValue({
                    state: "payed",
                    payDate: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse PayedState parameter 'payDate', expected iso string, but got '1234' from type number",
                });
            }
        });

        it("Value payed with no inApp", () => {
            try {
                new PayedState.Builder().fromValue({
                    state: "payed",
                    payDate: "2011-10-14T10:42:38+0000",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse PayedState parameter 'inApp'. Expected type 'boolean', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value payed with wrong inApp type", () => {
            try {
                new PayedState.Builder().fromValue({
                    state: "payed",
                    payDate: "2011-10-14T10:42:38+0000",
                    inApp: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse PayedState parameter 'inApp'. Expected type 'boolean', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value valid payed", () => {
            const payedState = new PayedState.Builder().fromValue({
                state: "payed",
                payDate: "2011-10-14T10:42:38+0000",
                inApp: true,
            }, loggingProperties.nextIndent);
            expect(payedState).to.be.deep.equal(new PayedState({
                state: "payed",
                inApp: true,
                payDate: new Date("2011-10-14T10:42:38+0000"),
            }));
        });
    });

    describe("PersonBuilder", () => {

        loggingProperties.append("PersonBuilder", undefined, "info");

        it("Value no object", () => {
            try {
                new Person.Builder().fromValue("asdf", loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person, expected type 'object', but bot asdf from type 'string'",
                });
            }
        });

        it("Value has no id", () => {
            try {
                new Person.Builder().fromValue({}, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse Person parameter 'id'. Expected type 'string', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong id type", () => {
            try {
                new Person.Builder().fromValue({
                    id: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse Person parameter 'id'. Expected type 'string', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value has invalid id guid", () => {
            try {
                new Person.Builder().fromValue({
                    id: "invalid",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse Guid, guid string isn't a valid Guid: invalid",
                });
            }
        });

        it("Value has wrong deleted type", () => {
            try {
                new Person.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    deleted: "asdf",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person, deleted argument wasn't from type boolean or was false.",
                });
            }
        });

        it("Value has deleted false", () => {
            try {
                new Person.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    deleted: false,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person, deleted argument wasn't from type boolean or was false.",
                });
            }
        });

        it("Value has deleted true", () => {
            const person = new Person.Builder().fromValue({
                id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                deleted: true,
            }, loggingProperties.nextIndent);
            expect(person).to.be.deep.equal(new Deleted<guid>(guid.fromString("4ED90BA2-D536-4B2B-A93E-403987A056CC", loggingProperties.nextIndent)));
        });

        it("Value has no name", () => {
            try {
                new Person.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse Person parameter 'name'. Expected type 'object', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong id type", () => {
            try {
                new Person.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    name: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse Person parameter 'name'. Expected type 'object', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value valid", () => {
            const person = new Person.Builder().fromValue({
                id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                name: {
                    first: "asdf",
                    last: "öjk",
                },
            }, loggingProperties.nextIndent);
            expect(person).to.be.deep.equal(new Person(
                guid.fromString("4ED90BA2-D536-4B2B-A93E-403987A056CC", loggingProperties.nextIndent),
                new PersonName("asdf", "öjk"),
            ));
        });
    });

    describe("PersonNameBuilder", () => {

        loggingProperties.append("PersonNameBuilder", undefined, "info");

        it("Value no object", () => {
            try {
                new PersonName.Builder().fromValue("asdf", loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse PersonName, expected type 'object', but bot asdf from type 'string'",
                });
            }
        });

        it("Value has no firstName", () => {
            try {
                new PersonName.Builder().fromValue({}, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse PersonName parameter 'first'. Expected type 'string', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong firstName type", () => {
            try {
                new PersonName.Builder().fromValue({
                    first: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse PersonName parameter 'first'. Expected type 'string', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value has no lastName", () => {
            const personName = new PersonName.Builder().fromValue({
                first: "first name",
            }, loggingProperties.nextIndent);
            expect(personName).to.be.deep.equal(new PersonName("first name", null));
        });

        it("Value has wrong lastName type", () => {
            try {
                new PersonName.Builder().fromValue({
                    first: "first name",
                    last: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse PersonName parameter 'last'. Expected type 'string' or undefined, but got '1234' from type 'number'.",
                });
            }
        });

        it("Value with lastName", () => {
            const personName = new PersonName.Builder().fromValue({
                first: "first name",
                last: "last name",
            }, loggingProperties.nextIndent);
            expect(personName).to.be.deep.equal(new PersonName("first name", "last name"));
        });
    });

    describe("PersonPropertiesWithIsCashierBuilder", () => {

        loggingProperties.append("PersonPropertiesWithIsCashierBuilder", undefined, "info");

        it("Value no object", () => {
            try {
                new PersonPropertiesWithIsCashier.Builder().fromValue("asdf", loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person properties, expected type 'object', but bot asdf from type 'string'",
                });
            }
        });

        it("Value has no id", () => {
            try {
                new PersonPropertiesWithIsCashier.Builder().fromValue({}, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person properties parameter 'id'. Expected type 'string', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong id type", () => {
            try {
                new PersonPropertiesWithIsCashier.Builder().fromValue({
                    id: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person properties parameter 'id'. Expected type 'string', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value has invalid id guid", () => {
            try {
                new PersonPropertiesWithIsCashier.Builder().fromValue({
                    id: "invalid",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse Guid, guid string isn't a valid Guid: invalid",
                });
            }
        });

        it("Value has no signInDate", () => {
            try {
                new PersonPropertiesWithIsCashier.Builder().fromValue({
                    id: "fd8f2af8-25bc-4eee-b4b7-b4206439395a",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person properties parameter 'signInDate'. Expected type 'string', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong signInDate type", () => {
            try {
                new PersonPropertiesWithIsCashier.Builder().fromValue({
                    id: "fd8f2af8-25bc-4eee-b4b7-b4206439395a",
                    signInDate: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person properties parameter 'signInDate'. Expected type 'string', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value has no isCashier", () => {
            try {
                new PersonPropertiesWithIsCashier.Builder().fromValue({
                    id: "fd8f2af8-25bc-4eee-b4b7-b4206439395a",
                    signInDate: "2011-10-14T10:42:38+0000",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person properties parameter 'isCashier'. Expected type 'boolean', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong isCashier type", () => {
            try {
                new PersonPropertiesWithIsCashier.Builder().fromValue({
                    id: "fd8f2af8-25bc-4eee-b4b7-b4206439395a",
                    signInDate: "2011-10-14T10:42:38+0000",
                    isCashier: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person properties parameter 'isCashier'. Expected type 'boolean', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value has no name", () => {
            try {
                new PersonPropertiesWithIsCashier.Builder().fromValue({
                    id: "fd8f2af8-25bc-4eee-b4b7-b4206439395a",
                    signInDate: "2011-10-14T10:42:38+0000",
                    isCashier: true,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person properties parameter 'name'. Expected type 'object', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong name type", () => {
            try {
                new PersonPropertiesWithIsCashier.Builder().fromValue({
                    id: "fd8f2af8-25bc-4eee-b4b7-b4206439395a",
                    signInDate: "2011-10-14T10:42:38+0000",
                    isCashier: true,
                    name: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person properties parameter 'name'. Expected type 'object', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value valid", () => {
            const personProperties = new PersonPropertiesWithIsCashier.Builder().fromValue({
                id: "fd8f2af8-25bc-4eee-b4b7-b4206439395a",
                signInDate: "2011-10-14T10:42:38+0000",
                isCashier: true,
                name: {
                    first: "asdf",
                },
            }, loggingProperties.nextIndent);
            expect(personProperties).to.be.deep.equal(new PersonPropertiesWithIsCashier(
                guid.fromString("fd8f2af8-25bc-4eee-b4b7-b4206439395a", loggingProperties.nextIndent),
                new Date("2011-10-14T10:42:38+0000"), true,
                new PersonName("asdf", null)
            ));
        });
    });

    describe("PersonPropertiesWithUserIdBuilder", () => {

        loggingProperties.append("PersonPropertiesWithUserIdBuilder", undefined, "info");

        it("Value no object", () => {
            try {
                new PersonPropertiesWithUserId.Builder().fromValue("asdf", loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person properties, expected type 'object', but bot asdf from type 'string'",
                });
            }
        });

        it("Value has no id", () => {
            try {
                new PersonPropertiesWithUserId.Builder().fromValue({}, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person properties parameter 'id'. Expected type 'string', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong id type", () => {
            try {
                new PersonPropertiesWithUserId.Builder().fromValue({
                    id: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person properties parameter 'id'. Expected type 'string', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value has invalid id guid", () => {
            try {
                new PersonPropertiesWithUserId.Builder().fromValue({
                    id: "invalid",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse Guid, guid string isn't a valid Guid: invalid",
                });
            }
        });

        it("Value has no signInDate", () => {
            try {
                new PersonPropertiesWithUserId.Builder().fromValue({
                    id: "fd8f2af8-25bc-4eee-b4b7-b4206439395a",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person properties parameter 'signInDate'. Expected type 'string', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong signInDate type", () => {
            try {
                new PersonPropertiesWithUserId.Builder().fromValue({
                    id: "fd8f2af8-25bc-4eee-b4b7-b4206439395a",
                    signInDate: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person properties parameter 'signInDate'. Expected type 'string', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value has no userId", () => {
            try {
                new PersonPropertiesWithUserId.Builder().fromValue({
                    id: "fd8f2af8-25bc-4eee-b4b7-b4206439395a",
                    signInDate: "2011-10-14T10:42:38+0000",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person properties parameter 'userId'. Expected type 'string', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong userId type", () => {
            try {
                new PersonPropertiesWithUserId.Builder().fromValue({
                    id: "fd8f2af8-25bc-4eee-b4b7-b4206439395a",
                    signInDate: "2011-10-14T10:42:38+0000",
                    userId: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person properties parameter 'userId'. Expected type 'string', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value has no name", () => {
            try {
                new PersonPropertiesWithUserId.Builder().fromValue({
                    id: "fd8f2af8-25bc-4eee-b4b7-b4206439395a",
                    signInDate: "2011-10-14T10:42:38+0000",
                    userId: "lkjnm",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person properties parameter 'name'. Expected type 'object', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong name type", () => {
            try {
                new PersonPropertiesWithUserId.Builder().fromValue({
                    id: "fd8f2af8-25bc-4eee-b4b7-b4206439395a",
                    signInDate: "2011-10-14T10:42:38+0000",
                    userId: "lkjnm",
                    name: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse person properties parameter 'name'. Expected type 'object', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value valid", () => {
            const personProperties = new PersonPropertiesWithUserId.Builder().fromValue({
                id: "fd8f2af8-25bc-4eee-b4b7-b4206439395a",
                signInDate: "2011-10-14T10:42:38+0000",
                userId: "lkjnm",
                name: {
                    first: "asdf",
                },
            }, loggingProperties.nextIndent);
            expect(personProperties).to.be.deep.equal(new PersonPropertiesWithUserId(
                guid.fromString("fd8f2af8-25bc-4eee-b4b7-b4206439395a", loggingProperties.nextIndent),
                new Date("2011-10-14T10:42:38+0000"), "lkjnm",
                new PersonName("asdf", null)
            ));
        });
    });

    describe("ReasonTemplateBuilder", () => {

        loggingProperties.append("ReasonTemplateBuilder", undefined, "info");

        it("Value no object", () => {
            try {
                new ReasonTemplate.Builder().fromValue("asdf", loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse ReasonTemplate, expected type 'object', but bot asdf from type 'string'",
                });
            }
        });

        it("Value has no id", () => {
            try {
                new ReasonTemplate.Builder().fromValue({}, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse ReasonTemplate parameter 'id'. Expected type 'string', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong id type", () => {
            try {
                new ReasonTemplate.Builder().fromValue({
                    id: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse ReasonTemplate parameter 'id'. Expected type 'string', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value has invalid id guid", () => {
            try {
                new ReasonTemplate.Builder().fromValue({
                    id: "invalid",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse Guid, guid string isn't a valid Guid: invalid",
                });
            }
        });

        it("Value has wrong deleted type", () => {
            try {
                new ReasonTemplate.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    deleted: "asdf",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse ReasonTemplate, deleted argument wasn't from type boolean or was false.",
                });
            }
        });

        it("Value has deleted false", () => {
            try {
                new ReasonTemplate.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    deleted: false,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse ReasonTemplate, deleted argument wasn't from type boolean or was false.",
                });
            }
        });

        it("Value has deleted true", () => {
            const reasonTemplate = new ReasonTemplate.Builder().fromValue({
                id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                deleted: true,
            }, loggingProperties.nextIndent);
            expect(reasonTemplate).to.be.deep.equal(new Deleted<guid>(guid.fromString("4ED90BA2-D536-4B2B-A93E-403987A056CC", loggingProperties.nextIndent)));
        });

        it("Value has no reason", () => {
            try {
                new ReasonTemplate.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse ReasonTemplate parameter 'reason'. Expected type 'string', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong reason type", () => {
            try {
                new ReasonTemplate.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    reason: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse ReasonTemplate parameter 'reason'. Expected type 'string', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value has no amount", () => {
            try {
                new ReasonTemplate.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    reason: "asdf",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse ReasonTemplate parameter 'amount'. Expected type 'number', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong amount type", () => {
            try {
                new ReasonTemplate.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    reason: "asdf",
                    amount: "asdf",
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse ReasonTemplate parameter 'amount'. Expected type 'number', but got 'asdf' from type 'string'.",
                });
            }
        });

        it("Value has no importance", () => {
            try {
                new ReasonTemplate.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    reason: "asdf",
                    amount: 12.50,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse ReasonTemplate parameter 'importance'. Expected type 'string', but got 'undefined' from type 'undefined'.",
                });
            }
        });

        it("Value has wrong importance type", () => {
            try {
                new ReasonTemplate.Builder().fromValue({
                    id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                    reason: "asdf",
                    amount: 12.50,
                    importance: 1234,
                }, loggingProperties.nextIndent);
                assert.fail("A statement above should throw an exception.");
            } catch (error) {
                expect(errorCodeAndMessage(error)).to.be.deep.equal({
                    code: "invalid-argument",
                    message: "Couldn't parse ReasonTemplate parameter 'importance'. Expected type 'string', but got '1234' from type 'number'.",
                });
            }
        });

        it("Value valid", () => {
            const reasonTemplate = new ReasonTemplate.Builder().fromValue({
                id: "4ED90BA2-D536-4B2B-A93E-403987A056CC",
                reason: "asdf",
                amount: 12.50,
                importance: "high",
            }, loggingProperties.nextIndent);
            expect(reasonTemplate).to.be.deep.equal(new ReasonTemplate(
                guid.fromString("4ED90BA2-D536-4B2B-A93E-403987A056CC", loggingProperties.nextIndent),
                "asdf", new Amount(12, 50), new Importance("high")
            ));
        });
    });
});
