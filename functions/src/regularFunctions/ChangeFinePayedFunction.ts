import {checkPrerequirements, FunctionDefaultParameters, FirebaseFunction, saveStatistic} from "../utils";
import {PayedState} from "../TypeDefinitions/PayedState";
import {ParameterContainer} from "../TypeDefinitions/ParameterContainer";
import {guid} from "../TypeDefinitions/guid";
import {ClubLevel} from "../TypeDefinitions/ClubLevel";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {StatisticsFine, Person, StatisticsFineReason} from "../TypeDefinitions/typeDefinitions";
import {Fine} from "../TypeDefinitions/Fine";
import {FineReasonCustom, FineReasonTemplate} from "../TypeDefinitions/FineReason";

/**
 * Type of Parameters for ChangeFinePayedFunction
 */
type FunctionParameters = FunctionDefaultParameters & { clubId: guid, fineId: guid, state: PayedState }

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
        const payedPath = `${clubPath}/fines/${this.parameters.fineId.guidString}/payed`;
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
            properties: {
                previousFine: statisticsFine,
                changedState: this.parameters.state.object,
            },
        });
    }

    /**
     * Gets previous fine for statistics.
     * @return {Promise<StatisticsFine>} Fine for statistics.
     */
    private async getStatisticsFine(): Promise<StatisticsFine> {

        // / Get previous payed state
        const clubPath = `${this.parameters.clubLevel.getClubComponent()}/${this.parameters.clubId.guidString}`;
        const finePath = `${clubPath}/fines/${this.parameters.fineId.guidString}`;
        const fineRef = admin.database().ref(finePath);
        const payedSnapshot = await fineRef.once("value");
        if (!payedSnapshot.exists())
            throw new functions.https.HttpsError("failed-precondition", "No fine payed state to change.");
        const previousFine = Fine.fromObject(payedSnapshot.val());

        // Set person of previous fine
        const personRef = admin.database().ref(`${clubPath}/persons/${previousFine.personId.guidString}`);
        const personSnapshot = await personRef.once("value");
        if (!personSnapshot.exists || personSnapshot.key == null)
            throw new functions.https.HttpsError("failed-precondition", "Couldn't get person for previous fine.");
        const person: Person = {
            id: personSnapshot.key,
            name: personSnapshot.child("name").val(),
        };

        // Set reason of previous fine if fine has template id
        let fineReason: StatisticsFineReason | null = previousFine.fineReason.value as FineReasonCustom | null;
        const reasonTemplateId = (previousFine.fineReason.value as FineReasonTemplate | null)?.reasonTemplateId;
        if (reasonTemplateId != null) {
            const reasonRef = admin.database().ref(`${clubPath}/reasons/${reasonTemplateId.guidString}`);
            const reasonSnapshot = await reasonRef.once("value");
            if (!reasonSnapshot.exists())
                throw new functions.https.HttpsError("failed-precondition", "Couldn't get reason for previous fine.");
            fineReason = {
                ...reasonSnapshot.val(),
                id: reasonTemplateId,
            };
        }

        // Get statistics fine
        return {
            id: this.parameters.fineId.guidString,
            person: person,
            payed: previousFine.payedState.object as any,
            number: previousFine.number,
            date: previousFine.date,
            reason: fineReason!,
        };
    }
}
