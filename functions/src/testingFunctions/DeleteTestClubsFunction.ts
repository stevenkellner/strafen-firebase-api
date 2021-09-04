import {ClubLevel} from "../TypeDefinitions/ClubLevel";
import {ParameterContainer} from "../TypeDefinitions/ParameterContainer";
import {checkPrerequirements, existsData, FirebaseFunction, FunctionDefaultParameters} from "../utils";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export class DeleteTestClubsFunction implements FirebaseFunction {

    private parameters: FunctionDefaultParameters;

    constructor(data: any) {
        const parameterContainer = new ParameterContainer(data);
        this.parameters = DeleteTestClubsFunction.parseParameters(parameterContainer);
    }

    private static parseParameters(container: ParameterContainer): FunctionDefaultParameters {
        return {
            privateKey: container.getParameter("privateKey", "string"),
            clubLevel: ClubLevel.fromParameterContainer(container, "clubLevel"),
        };
    }

    async executeFunction(auth?: { uid: string }): Promise<void> {
        await checkPrerequirements(this.parameters, auth);
        if (!this.parameters.clubLevel.isTesting())
            throw new functions.https.HttpsError("failed-precondition", "Function can only be called for testing.");
        const clubsPath = this.parameters.clubLevel.getClubComponent();
        const clubsRef = admin.database().ref(clubsPath);
        if (await existsData(clubsRef))
            clubsRef.remove(error => {
                if (error != null)
                    throw error;
            });
    }
}
