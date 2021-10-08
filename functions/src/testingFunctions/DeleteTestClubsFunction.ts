import * as admin from "firebase-admin";
import { ClubLevel } from "../TypeDefinitions/ClubLevel";
import { ParameterContainer } from "../TypeDefinitions/ParameterContainer";
import { checkPrerequirements, existsData, FirebaseFunction, FunctionDefaultParameters, httpsError } from "../utils";
import { LoggingProperties } from "../TypeDefinitions/LoggingProperties";

export class DeleteTestClubsFunction implements FirebaseFunction {

    private parameters: FunctionDefaultParameters;

    private loggingProperties: LoggingProperties;

    constructor(data: any) {
        const parameterContainer = new ParameterContainer(data);
        this.loggingProperties = LoggingProperties.withFirst(parameterContainer, "DeleteTestClubsFunction.constructor", {data: data}, "notice");
        this.parameters = DeleteTestClubsFunction.parseParameters(parameterContainer, this.loggingProperties.nextIndent);
    }

    private static parseParameters(container: ParameterContainer, loggingProperties?: LoggingProperties): FunctionDefaultParameters {
        loggingProperties?.append("DeleteTestClubsFunction.parseParameters", {container: container});
        return {
            privateKey: container.getParameter("privateKey", "string", loggingProperties?.nextIndent),
            clubLevel: new ClubLevel.Builder().fromParameterContainer(container, "clubLevel", loggingProperties?.nextIndent),
        };
    }

    async executeFunction(auth?: { uid: string }): Promise<void> {
        this.loggingProperties?.append("DeleteTestClubsFunction.executeFunction", {auth: auth}, "info");
        await checkPrerequirements(this.parameters, this.loggingProperties.nextIndent, auth);
        if (this.parameters.clubLevel.value !== "testing")
            throw httpsError("failed-precondition", "Function can only be called for testing.", this.loggingProperties);
        const clubsPath = this.parameters.clubLevel.clubComponent;
        const clubsRef = admin.database().ref(clubsPath);
        if (await existsData(clubsRef))
            clubsRef.remove(error => {
                if (error != null)
                    throw error;
            });
    }
}
