import {ClubLevel} from "../TypeDefinitions/ClubLevel";
import {guid} from "../TypeDefinitions/guid";
import {ParameterContainer} from "../TypeDefinitions/ParameterContainer";
import {checkPrerequirements, FirebaseFunction, FunctionDefaultParameters} from "../utils";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {defaultTestClub} from "./testClubs/default";

type FunctionParameters = FunctionDefaultParameters & { clubId: guid, testClubType: TestClubType }

export class NewTestClubFunction implements FirebaseFunction {

    private parameters: FunctionParameters;

    constructor(data: any) {
        const parameterContainer = new ParameterContainer(data);
        this.parameters = NewTestClubFunction.parseParameters(parameterContainer);
    }

    private static parseParameters(container: ParameterContainer): FunctionParameters {
        return {
            privateKey: container.getParameter("privateKey", "string"),
            clubLevel: ClubLevel.fromParameterContainer(container, "clubLevel"),
            clubId: guid.fromParameterContainer(container, "clubId"),
            testClubType: TestClubType.fromParameterContainer(container, "testClubType"),
        };
    }

    async executeFunction(auth?: { uid: string }): Promise<void> {
        await checkPrerequirements(this.parameters, auth);
        if (!this.parameters.clubLevel.isTesting())
            throw new functions.https.HttpsError("failed-precondition", "Function can only be called for testing.");
        const clubPath = `${this.parameters.clubLevel.getClubComponent()}/${this.parameters.clubId.guidString}`;
        const clubRef = admin.database().ref(clubPath);
        const testClub = this.parameters.testClubType.getTestClub();
        await clubRef.set(testClub, error => {
            if (error != null)
                throw error;
        });
    }
}

class TestClubType {

    readonly value: "default"

    private constructor(value: "default") {
        this.value = value;
    }

    static fromString(value: string): TestClubType {
        if (value != "default")
            throw new functions.https.HttpsError("invalid-argument", `Couldn't parse TestClubType, invalid type: ${value}`);
        return new TestClubType(value);
    }
    static fromParameterContainer(container: ParameterContainer, parameterName: string): TestClubType {
        return TestClubType.fromString(container.getParameter(parameterName, "string"));
    }

    getTestClub(): any {
        switch (this.value) {
        case "default":
            return defaultTestClub;
        }
    }
}
