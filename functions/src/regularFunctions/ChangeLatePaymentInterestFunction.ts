import {ChangeType} from "../TypeDefinitions/ChangeType";
import {ClubLevel} from "../TypeDefinitions/ClubLevel";
import {guid} from "../TypeDefinitions/guid";
import {ParameterContainer} from "../TypeDefinitions/ParameterContainer";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {Reference} from "@firebase/database-types";
import {checkPrerequirements, existsData, FirebaseFunction, FunctionDefaultParameters, saveStatistic, StatisticsProperties} from "../utils";
import {LatePaymentInterest} from "../TypeDefinitions/LatePaymentInterest";

/**
 * Type of Parameters for ChangeLatePayementInterestFunction
 */
 type FunctionParameters = FunctionDefaultParameters & { clubId: guid, changeType: ChangeType, interest: LatePaymentInterest }

 interface FunctionStatisticsPropertiesObject {
    previousInterest: LatePaymentInterest | null;
    changedInterest: LatePaymentInterest | null;
 }

class FunctionStatisticsProperties implements StatisticsProperties<FunctionStatisticsPropertiesObject> {
     readonly previousInterest: LatePaymentInterest | null;
     readonly changedInterest: LatePaymentInterest | null;

     constructor(previousInterest: LatePaymentInterest | null, changedInterest: LatePaymentInterest | null) {
         this.previousInterest = previousInterest;
         this.changedInterest = changedInterest;
     }

     get ["object"](): FunctionStatisticsPropertiesObject {
         return {
             previousInterest: this.previousInterest,
             changedInterest: this.changedInterest,
         };
     }
}

/**
 * @summary
 * Changes the late payment interest of club with given club id.
 *
 * Saved statistik:
 *  - name: changeLatePaymentInterest
 *  - properties:
 *      - previousInterest ({@link LatePaymentInterest} | null): Previous late payment interest
 *      - changedInterest ({@link LatePaymentInterest} | null): Changed late payment interest or null if change type is `delete`
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - clubLevel (string): level of the club (`regular`, `debug`, `testing`)
 *  - clubId (string): id of the club to change the late payment interest
 *  - changeType (string): type of the change (`update`, `delete`)
 *  - interest ({@link LatePaymentInterest}): interest to change
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - internal: if couldn't change interest in database
 */
export class ChangeLatePaymentInterestFunction implements FirebaseFunction {

    /**
     * Parameters needed for this function.
     */
    private parameters: FunctionParameters;

    /**
     * Initilizes function with given over data.
     * @param {any} data Data to get parameters from.
     */
    constructor(data: any) {
        const parameterContainer = new ParameterContainer(data);
        this.parameters = ChangeLatePaymentInterestFunction.parseParameters(parameterContainer);
    }

    /**
     * Parses parameters for this function from a parameter container.
     * @param {ParameterContainer} container Parameter container to get parameters from.
     * @return {FunctionParameters} Parsed parameters for this function.
     */
    private static parseParameters(container: ParameterContainer): FunctionParameters {
        return {
            privateKey: container.getParameter("privateKey", "string"),
            clubLevel: ClubLevel.fromParameterContainer(container, "clubLevel"),
            clubId: guid.fromParameterContainer(container, "clubId"),
            changeType: ChangeType.fromParameterContainer(container, "changeType"),
            interest: LatePaymentInterest.fromParameterContainer(container, "interest"),
        };
    }

    private getInterestRef(): Reference {
        const interestPath = `${this.parameters.clubLevel.getClubComponent()}/${this.parameters.clubId.guidString}/latePaymentInterest`;
        return admin.database().ref(interestPath);
    }

    /**
     * Executes this firebase function.
     * @param {{uid: string} | undefined} auth Authentication state.
     */
    async executeFunction(auth?: { uid: string }): Promise<void> {

        // Check prerequirements
        const clubPath = `${this.parameters.clubLevel.getClubComponent()}/${this.parameters.clubId.guidString}`;
        await checkPrerequirements(this.parameters, auth, this.parameters.clubId);

        // Get previous interest
        const interestRef = this.getInterestRef();
        const interestSnapshot = await interestRef.once("value");
        let previousInterest: LatePaymentInterest | null = null;
        if (interestSnapshot.exists())
            previousInterest = LatePaymentInterest.fromSnapshot(interestSnapshot);

        // Change interest
        let changedInterest: LatePaymentInterest | null = null;
        switch (this.parameters.changeType.value) {
        case "delete":
            await this.deleteItem();
            break;

        case "update":
            await this.updateItem();
            changedInterest = this.parameters.interest;
            break;
        }
        // Save statistic
        await saveStatistic(clubPath, {
            name: "changeLatePaymentInterest",
            properties: new FunctionStatisticsProperties(previousInterest, changedInterest),
        });
    }

    private async deleteItem(): Promise<void> {
        const interestRef = this.getInterestRef();
        if (await existsData(interestRef)) {
            await interestRef.remove(error => {
                if (error != null)
                    throw new functions.https.HttpsError("internal", `Couldn't delete late payment interest, underlying error: ${error.name}, ${error.message}`);
            });
        }
    }

    private async updateItem(): Promise<void> {
        const interestRef = this.getInterestRef();
        await interestRef.set(this.parameters.interest, error => {
            if (error != null)
                throw new functions.https.HttpsError("internal", `Couldn't update delete late payment interest, underlying error: ${error.name}, ${error.message}`);
        });
    }
}
