import * as admin from "firebase-admin";
import { ClubLevel } from "../TypeDefinitions/ClubLevel";
import { guid } from "../TypeDefinitions/guid";
import { ParameterContainer } from "../TypeDefinitions/ParameterContainer";
import { checkPrerequirements, FirebaseFunction, FunctionDefaultParameters, httpsError } from "../utils";
import { defaultTestClub } from "./testClubs/default";
import { LoggingProperties } from "../TypeDefinitions/LoggingProperties";

type FunctionParameters = FunctionDefaultParameters & { clubId: guid, testClubType: TestClubType }

export class NewTestClubFunction implements FirebaseFunction {

    private parameters: FunctionParameters;

    private loggingProperties: LoggingProperties;

    constructor(data: any) {
        const parameterContainer = new ParameterContainer(data);
        this.loggingProperties = LoggingProperties.withFirst(parameterContainer, "NewTestClubFunction.constructor", {data: data}, "notice");
        this.parameters = NewTestClubFunction.parseParameters(parameterContainer, this.loggingProperties.nextIndent);
    }

    private static parseParameters(container: ParameterContainer, loggingProperties: LoggingProperties): FunctionParameters {
        loggingProperties.append("NewTestClubFunction.parseParameters", {container: container});
        return {
            privateKey: container.getParameter("privateKey", "string", loggingProperties.nextIndent),
            clubLevel: new ClubLevel.Builder().fromParameterContainer(container, "clubLevel", loggingProperties.nextIndent),
            clubId: guid.fromParameterContainer(container, "clubId", loggingProperties.nextIndent),
            testClubType: TestClubType.fromParameterContainer(container, "testClubType", loggingProperties.nextIndent),
        };
    }

    async executeFunction(auth?: { uid: string }): Promise<void> {
        this.loggingProperties.append("NewTestClubFunction.executeFunction", {auth: auth}, "info");
        await checkPrerequirements(this.parameters, this.loggingProperties.nextIndent, auth);
        if (this.parameters.clubLevel.value !== "testing")
            throw httpsError("failed-precondition", "Function can only be called for testing.", this.loggingProperties);
        const clubPath = `${this.parameters.clubLevel.clubComponent}/${this.parameters.clubId.guidString}`;
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

    static fromString(value: string, loggingProperties: LoggingProperties): TestClubType {
        loggingProperties.append("TestClubType.fromString", {value: value});
        if (value != "default")
            throw httpsError("invalid-argument", `Couldn't parse TestClubType, invalid type: ${value}`, loggingProperties);
        return new TestClubType(value);
    }
    static fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties: LoggingProperties): TestClubType {
        loggingProperties.append("TestClubType.fromParameterContainer", {container: container, parameterName: parameterName});
        return TestClubType.fromString(container.getParameter(parameterName, "string", loggingProperties.nextIndent), loggingProperties.nextIndent);
    }

    getTestClub(): any {
        switch (this.value) {
        case "default":
            return defaultTestClub;
        }
    }
}
