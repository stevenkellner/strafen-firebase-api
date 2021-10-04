import {checkPrerequirements, FunctionDefaultParameters, FirebaseFunction, existsData, saveStatistic, StatisticsProperties, undefinedAsNull} from "../utils";
import {ParameterContainer} from "../TypeDefinitions/ParameterContainer";
import {guid} from "../TypeDefinitions/guid";
import {ClubLevel} from "../TypeDefinitions/ClubLevel";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {ChangeType} from "../TypeDefinitions/ChangeType";
import {Reference} from "@firebase/database-types";
import {Fine, StatisticsFine, StatisticsFineObject} from "../TypeDefinitions/Fine";

/**
 * Type of Parameters for ChangeFineFunction
 */
type FunctionParameters = FunctionDefaultParameters & { clubId: guid, changeType: ChangeType, fine: Fine }

interface FunctionStatisticsPropertiesObject {
    previousFine: StatisticsFineObject | null;
    changedFine: StatisticsFineObject | null;
}

class FunctionStatisticsProperties implements StatisticsProperties<FunctionStatisticsPropertiesObject> {
    readonly previousFine: StatisticsFine | null;
    readonly changedFine: StatisticsFine | null;

    constructor(previousFine: StatisticsFine | null, changedFine: StatisticsFine | null) {
        this.previousFine = previousFine;
        this.changedFine = changedFine;
    }

    get ["object"](): FunctionStatisticsPropertiesObject {
        return {
            previousFine: undefinedAsNull(this.previousFine?.object),
            changedFine: undefinedAsNull(this.changedFine?.object),
        };
    }
}

/**
 * @summary
 * Changes a element of fine list.
 *
 * Saved statistik:
 *  - name: changeFine
 *  - properties:
 *      - previousFine ({@link StatisticsFine} | null): Previous fine to change
 *      - changedFine ({@link StatisticsFine} | null): Changed fine or null if change type is `delete`
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - clubLevel ({@link ClubLevel}): level of the club change
 *  - clubId ({@link guid}): id of the club to force sign out the person
 *  - changeType ({@link ChangeType}}): type of the change
 *  - fine ({@link Fine}): fine to change
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - internal: if couldn't change fine in database
 */
export class ChangeFineFunction implements FirebaseFunction {

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
        this.parameters = ChangeFineFunction.parseParameters(parameterContainer);
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
            fine: Fine.fromParameterContainer(container, "fine"),
        };
    }

    private getFineRef(): Reference {
        const clubPath = `${this.parameters.clubLevel.getClubComponent()}/${this.parameters.clubId.guidString}`;
        const finePath = `${clubPath}/fines/${this.parameters.fine.id.guidString}`;
        return admin.database().ref(finePath);
    }

    /**
     * Executes this firebase function.
     * @param {{uid: string} | undefined} auth Authentication state.
     */
    async executeFunction(auth?: { uid: string }): Promise<void> {

        // Check prerequirements
        const clubPath = `${this.parameters.clubLevel.getClubComponent()}/${this.parameters.clubId.guidString}`;
        await checkPrerequirements(this.parameters, auth, this.parameters.clubId);

        // Get previous fine
        const fineRef = this.getFineRef();
        const fineSnapshot = await fineRef.once("value");
        let previousFine: StatisticsFine | null = null;
        if (fineSnapshot.exists())
            previousFine = await Fine.fromSnapshot(fineSnapshot).forStatistics(clubPath);

        // Change fine
        let changedFine: StatisticsFine | null = null;
        switch (this.parameters.changeType.value) {
        case "delete":
            await this.deleteItem();
            break;

        case "update":
            await this.updateItem();
            changedFine = await this.parameters.fine.forStatistics(clubPath);
            break;
        }

        // Save statistic
        await saveStatistic(clubPath, {
            name: "changeFine",
            properties: new FunctionStatisticsProperties(previousFine, changedFine),
        });
    }

    private async deleteItem(): Promise<void> {
        const fineRef = this.getFineRef();
        if (await existsData(fineRef)) {
            await fineRef.remove(error => {
                if (error != null)
                    throw new functions.https.HttpsError("internal", `Couldn't delete fine, underlying error: ${error.name}, ${error.message}`);
            });
        }
    }

    private async updateItem(): Promise<void> {
        const fineRef = this.getFineRef();
        await fineRef.set(this.parameters.fine?.objectWithoutId, error => {
            if (error != null)
                throw new functions.https.HttpsError("internal", `Couldn't update fine, underlying error: ${error.name}, ${error.message}`);
        });
    }
}
