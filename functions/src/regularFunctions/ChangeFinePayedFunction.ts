import {checkPrerequirements, FunctionDefaultParameters, FirebaseFunction, saveStatistic, StatisticsProperties, checkUpdateTimestamp, httpsError} from "../utils";
import {PayedState} from "../TypeDefinitions/PayedState";
import {ParameterContainer} from "../TypeDefinitions/ParameterContainer";
import {guid} from "../TypeDefinitions/guid";
import {ClubLevel} from "../TypeDefinitions/ClubLevel";
import * as admin from "firebase-admin";
import {Fine} from "../TypeDefinitions/Fine";
import { LoggingProperties } from "../TypeDefinitions/LoggingProperties";

/**
 * Type of Parameters for ChangeFinePayedFunction
 */
type FunctionParameters = FunctionDefaultParameters & { clubId: guid, fineId: guid, state: PayedState }

interface FunctionStatisticsPropertiesObject {
    previousFine: Fine.Statistic.ServerObject;
    changedState: PayedState.ServerObjectWithoutUpdateProperties;
}

class FunctionStatisticsProperties implements StatisticsProperties<FunctionStatisticsPropertiesObject> {
    readonly previousFine: Fine.Statistic;
    readonly changedState: PayedState;

    constructor(previousFine: Fine.Statistic, changedState: PayedState) {
        this.previousFine = previousFine;
        this.changedState = changedState;
    }

    get ["object"](): FunctionStatisticsPropertiesObject {
        return {
            previousFine: this.previousFine.serverObject,
            changedState: this.changedState.serverObjectWithoutUpdateProperties,
        };
    }
}

/**
 * @summary
 * Changes payement state of fine with specified fine id.
 *
 * Saved statistik:
 *  - name: changeFinePayed
 *  - properties:
 *      - previousFine ({@link StatisticsFine}}): fine before the change
 *      - changedState ({@link PayedState}): payed state after the change
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - clubLevel ({@link ClubLevel}): level of the club change
 *  - clubId ({@link guid}): id of the club to change the fine
 *  - fineId ({@link guid}): id of the fine to change the payed state
 *  - state ({@link PayedState}): new state of the payment of the fine
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - internal: if couldn't change payed state in database
 *    - failed-precondition: if old payed state, reason with reason template id or person for statistik doesn't exist
 */
export class ChangeFinePayedFunction implements FirebaseFunction {

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
        this.loggingProperties = LoggingProperties.withFirst(parameterContainer, "ChangeFinePayedFunction.constructor", {data: data}, "notice");
        this.parameters = ChangeFinePayedFunction.parseParameters(parameterContainer, this.loggingProperties.nextIndent);
    }

    /**
     * Parses parameters for this function from a parameter container.
     * @param {ParameterContainer} container Parameter container to get parameters from.
     * @return {FunctionParameters} Parsed parameters for this function.
     */
    private static parseParameters(container: ParameterContainer, loggingProperties?: LoggingProperties): FunctionParameters {
        loggingProperties?.append("ChangeFinePayedFunction.parseParameter", {container: container});
        return {
            privateKey: container.getParameter("privateKey", "string", loggingProperties?.nextIndent),
            clubLevel: ClubLevel.fromParameterContainer(container, "clubLevel", loggingProperties?.nextIndent),
            clubId: guid.fromParameterContainer(container, "clubId", loggingProperties?.nextIndent),
            fineId: guid.fromParameterContainer(container, "fineId", loggingProperties?.nextIndent),
            state: PayedState.fromParameterContainer(container, "state", loggingProperties?.nextIndent),
        };
    }

    /**
     * Executes this firebase function.
     * @param {{uid: string} | undefined} auth Authentication state.
     */
    async executeFunction(auth?: { uid: string }): Promise<void> {
        this.loggingProperties?.append("ChangeFinePayedFunction.executeFunction", {auth: auth}, "info");

        // Check prerequirements and get a reference to payed state of the fine
        await checkPrerequirements(this.parameters, this.loggingProperties.nextIndent, auth, this.parameters.clubId);

        const clubPath = `${this.parameters.clubLevel.getClubComponent()}/${this.parameters.clubId.guidString}`;
        const payedPath = `${clubPath}/fines/${this.parameters.fineId.guidString}/payedState`;
        const payedRef = admin.database().ref(payedPath);

        // Check update timestamp
        await checkUpdateTimestamp(`${payedPath}/updateProperties`, this.parameters.state.updateProperties, this.loggingProperties.nextIndent);

        // Get statistics fine
        const statisticsFine = await this.getStatisticsFine();

        // Set payed state
        await payedRef.set({
            ...this.parameters.state.serverObject,
            updateProperties: this.parameters.state.updateProperties.object,
        }, error => {
            if (error != null)
                throw httpsError("internal", `Couldn't update payed state, underlying error: ${error.name}, ${error.message}`, this.loggingProperties.nextIndent);
        });

        // Save statistic
        await saveStatistic(clubPath, {
            name: "changeFinePayed",
            properties: new FunctionStatisticsProperties(statisticsFine, this.parameters.state),
        }, this.loggingProperties.nextIndent);
    }

    /**
     * Gets previous fine for statistics.
     * @return {Promise<StatisticsFine>} Fine for statistics.
     */
    private async getStatisticsFine(): Promise<Fine.Statistic> {
        this.loggingProperties?.append("ChangeFinePayedFunction.getStatisticsFine");
        const clubPath = `${this.parameters.clubLevel.getClubComponent()}/${this.parameters.clubId.guidString}`;
        const finePath = `${clubPath}/fines/${this.parameters.fineId.guidString}`;
        const fineRef = admin.database().ref(finePath);
        const payedSnapshot = await fineRef.once("value");
        return Fine.fromSnapshot(payedSnapshot, this.loggingProperties.nextIndent).forStatistics(clubPath, this.loggingProperties.nextIndent);
    }
}
