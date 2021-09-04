import * as functions from "firebase-functions";
import {ParameterContainer} from "./ParameterContainer";

/**
 * Club level of firebase function.
 */
export class ClubLevel {

    /**
     * Value of the club level.
     */
    private readonly value: "regular" | "debug" | "testing";

    /**
     * Initializes club level with string value.
     * @param {"regular" | "debug" | "testing"} value Value of the club level.
     */
    private constructor(value: "regular" | "debug" | "testing") {
        this.value = value;
    }

    /**
     * Constructs club level from an string or throws a HttpsError if parsing failed.
     * @param {string} value Value of the club level.
     * @return {ClubLevel} Parsed club level.
     */
    static fromString(value: string): ClubLevel {
        if (value == "regular" || value == "debug" || value == "testing")
            return new ClubLevel(value);
        throw new functions.https.HttpsError("invalid-argument", `Couldn't parse ClubLevel, expected 'regular', 'debug' or 'testing', but got ${value} instead.`);
    }

    /**
     * Constructs club level from parameter of parameter container with specified parameter name
     * or throws a HttpsError if parsing failed.
     * @param {ParameterContainer} container Parameter container to get parameter from.
     * @param {string} parameterName Name of parameter from parameter container.
     * @return {ClubLevel} Parsed club level.
     */
    static fromParameterContainer(container: ParameterContainer, parameterName: string): ClubLevel {
        return ClubLevel.fromString(container.getParameter(parameterName, "string"));
    }

    /**
     * Indicates whether club level is regular.
     * @return {boolean} True if club level is regular.
     */
    isRegular(): boolean {
        return this.value == "regular";
    }

    /**
     * Indicates whether club level is debug.
     * @return {boolean} True if club level is debug.
     */
    isDebug(): boolean {
        return this.value == "debug";
    }

    /**
     * Indicates whether club level is testing.
     * @return {boolean} True if club level is testing.
     */
    isTesting(): boolean {
        return this.value == "testing";
    }

    /**
     * Returns club component from this club level.
     * @return {string} Club component string.
     */
    getClubComponent(): string {
        switch (this.value) {
        case "regular": return "clubs";
        case "debug": return "debugClubs";
        case "testing": return "testableClubs";
        }
    }
}
