import * as admin from "firebase-admin";
import { ChangeType } from "../TypeDefinitions/ChangeType";
import { ClubLevel } from "../TypeDefinitions/ClubLevel";
import { guid} from "../TypeDefinitions/guid";
import { ParameterContainer } from "../TypeDefinitions/ParameterContainer";
import { Reference} from "@firebase/database-types";
import { checkPrerequirements, existsData, FirebaseFunction, FunctionDefaultParameters, httpsError, saveStatistic, StatisticsProperties } from "../utils";
import { LatePaymentInterest } from "../TypeDefinitions/LatePaymentInterest";
import { LoggingProperties } from "../TypeDefinitions/LoggingProperties";

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

     get ["serverObject"](): FunctionStatisticsPropertiesObject {
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

    private loggingProperties: LoggingProperties;

    /**
     * Initilizes function with given over data.
     * @param {any} data Data to get parameters from.
     */
    constructor(data: any) {
        const parameterContainer = new ParameterContainer(data);
        this.loggingProperties = LoggingProperties.withFirst(parameterContainer, "ChangeLatePaymentInterestFunction.constructor", {data: data}, "notice");
        this.parameters = ChangeLatePaymentInterestFunction.parseParameters(parameterContainer, this.loggingProperties.nextIndent);
    }

    /**
     * Parses parameters for this function from a parameter container.
     * @param {ParameterContainer} container Parameter container to get parameters from.
     * @return {FunctionParameters} Parsed parameters for this function.
     */
    private static parseParameters(container: ParameterContainer, loggingProperties: LoggingProperties): FunctionParameters {
        loggingProperties.append("ChangeLatePaymentInterestFunction.parseParameter", {container: container});
        return {
            privateKey: container.getParameter("privateKey", "string", loggingProperties.nextIndent),
            clubLevel: new ClubLevel.Builder().fromParameterContainer(container, "clubLevel", loggingProperties.nextIndent),
            clubId: guid.fromParameterContainer(container, "clubId", loggingProperties.nextIndent),
            changeType: new ChangeType.Builder().fromParameterContainer(container, "changeType", loggingProperties.nextIndent),
            interest: new LatePaymentInterest.Builder().fromParameterContainer(container, "interest", loggingProperties.nextIndent),
        };
    }

    private getInterestRef(): Reference {
        const interestPath = `${this.parameters.clubLevel.clubComponent}/${this.parameters.clubId.guidString}/latePaymentInterest`;
        return admin.database().ref(interestPath);
    }

    /**
     * Executes this firebase function.
     * @param {{uid: string} | undefined} auth Authentication state.
     */
    async executeFunction(auth?: { uid: string }): Promise<void> {
        this.loggingProperties.append("ChangeLatePaymentInterestFunction.executeFunction", {auth: auth}, "info");

        // Check prerequirements
        const clubPath = `${this.parameters.clubLevel.clubComponent}/${this.parameters.clubId.guidString}`;
        await checkPrerequirements(this.parameters, this.loggingProperties.nextIndent, auth, this.parameters.clubId);

        // Get previous interest
        const interestRef = this.getInterestRef();
        const interestSnapshot = await interestRef.once("value");
        let previousInterest: LatePaymentInterest | null = null;
        if (interestSnapshot.exists())
            previousInterest = new LatePaymentInterest.Builder().fromSnapshot(interestSnapshot, this.loggingProperties.nextIndent);

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
        }, this.loggingProperties.nextIndent);
    }

    private async deleteItem(): Promise<void> {
        this.loggingProperties.append("ChangeLatePaymentInterestFunction.deleteItem");
        const interestRef = this.getInterestRef();
        if (await existsData(interestRef)) {
            await interestRef.remove(error => {
                if (error != null)
                    throw httpsError("internal", `Couldn't delete late payment interest, underlying error: ${error.name}, ${error.message}`, this.loggingProperties);
            });
        }
    }

    private async updateItem(): Promise<void> {
        this.loggingProperties.append("ChangeLatePaymentInterestFunction.updateItem");
        const interestRef = this.getInterestRef();
        await interestRef.set(this.parameters.interest, error => {
            if (error != null)
                throw httpsError("internal", `Couldn't update delete late payment interest, underlying error: ${error.name}, ${error.message}`, this.loggingProperties);
        });
    }
}
