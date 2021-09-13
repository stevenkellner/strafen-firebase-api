import {checkPrerequirements, FunctionDefaultParameters, FirebaseFunction, saveStatistic, StatisticsProperties} from "../utils";
import {PayedState, PayedStateObject} from "../TypeDefinitions/PayedState";
import {ParameterContainer} from "../TypeDefinitions/ParameterContainer";
import {guid} from "../TypeDefinitions/guid";
import {ClubLevel} from "../TypeDefinitions/ClubLevel";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {Fine, StatisticsFineObject} from "../TypeDefinitions/Fine";
import {Person} from "../TypeDefinitions/Person";

/**
 * Type of Parameters for ChangeFinePayedFunction
 */
type FunctionParameters = FunctionDefaultParameters & { clubId: guid, fineId: guid, state: PayedState }

interface FunctionStatisticsPropertiesObject {
    previousFine: StatisticsFineObject;
    changedState: PayedStateObject;
}

class FunctionStatisticsProperties implements StatisticsProperties<FunctionStatisticsPropertiesObject> {
    readonly previousFine: StatisticsFineObject;
    readonly changedState: PayedState;

    constructor(previousFine: StatisticsFineObject, changedState: PayedState) {
        this.previousFine = previousFine;
        this.changedState = changedState;
    }

    get ["object"](): FunctionStatisticsPropertiesObject {
        return {
            previousFine: this.previousFine,
            changedState: this.changedState.object,
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

    /**
     * Initilizes function with given over data.
     * @param {any} data Data to get parameters from.
     */
    constructor(data: any) {
        const parameterContainer = new ParameterContainer(data);
        this.parameters = ChangeFinePayedFunction.parseParameters(parameterContainer);
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
            fineId: guid.fromParameterContainer(container, "fineId"),
            state: PayedState.fromParameterContainer(container, "state"),
        };
    }

    /**
     * Executes this firebase function.
     * @param {{uid: string} | undefined} auth Authentication state.
     */
    async executeFunction(auth?: { uid: string }): Promise<void> {

        // Check prerequirements and get a reference to payed state of the fine
        await checkPrerequirements(this.parameters, auth, this.parameters.clubId);

        const clubPath = `${this.parameters.clubLevel.getClubComponent()}/${this.parameters.clubId.guidString}`;
        const payedPath = `${clubPath}/fines/${this.parameters.fineId.guidString}/payedState`;
        const payedRef = admin.database().ref(payedPath);

        // Get statistics fine
        const statisticsFine = await this.getStatisticsFine();

        // Set payed state
        await payedRef.set(this.parameters.state.object, error => {
            if (error != null)
                throw new functions.https.HttpsError("internal", `Couldn't update payed state, underlying error: ${error.name}, ${error.message}`);
        });

        // Save statistic
        await saveStatistic(clubPath, {
            name: "changeFinePayed",
            properties: new FunctionStatisticsProperties(statisticsFine, this.parameters.state),
        });
    }

    /**
     * Gets previous fine for statistics.
     * @return {Promise<StatisticsFine>} Fine for statistics.
     */
    private async getStatisticsFine(): Promise<StatisticsFineObject> {

        // Get previous payed state
        const clubPath = `${this.parameters.clubLevel.getClubComponent()}/${this.parameters.clubId.guidString}`;
        const finePath = `${clubPath}/fines/${this.parameters.fineId.guidString}`;
        const fineRef = admin.database().ref(finePath);
        const payedSnapshot = await fineRef.once("value");
        const previousFine = Fine.fromSnapshot(payedSnapshot);

        // Set person of previous fine
        const personRef = admin.database().ref(`${clubPath}/persons/${previousFine.personId.guidString}`);
        const personSnapshot = await personRef.once("value");
        const person = Person.fromSnapshot(personSnapshot);

        // Set reason of previous fine if fine has template id
        const statisticsFineReason = await previousFine.fineReason.forStatistics(clubPath);

        // Get statistics fine
        return {
            id: this.parameters.fineId.guidString,
            person: person.object,
            payedState: previousFine.payedState.object,
            number: previousFine.number,
            date: previousFine.date,
            fineReason: statisticsFineReason.object,
        };
    }
}
