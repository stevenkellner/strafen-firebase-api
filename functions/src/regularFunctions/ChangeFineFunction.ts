import * as admin from "firebase-admin";
import { checkPrerequirements, FunctionDefaultParameters, FirebaseFunction, existsData, saveStatistic, StatisticsProperties, undefinedAsNull, httpsError, checkUpdateTimestamp, Deleted } from "../utils";
import { ParameterContainer } from "../TypeDefinitions/ParameterContainer";
import { guid } from "../TypeDefinitions/guid";
import { ClubLevel } from "../TypeDefinitions/ClubLevel";
import { ChangeType } from "../TypeDefinitions/ChangeType";
import { Reference } from "@firebase/database-types";
import { Fine} from "../TypeDefinitions/Fine";
import { LoggingProperties } from "../TypeDefinitions/LoggingProperties";
import { getUpdatable, Updatable } from "../TypeDefinitions/UpdateProperties";

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
 *  - fine ({@link Updatable}<{@link Fine} | {@link Deleted}>): fine to change
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
    private parameters: ChangeFineFunction.Parameters;

    private loggingProperties: LoggingProperties;

    /**
     * Initilizes function with given over data.
     * @param {any} data Data to get parameters from.
     */
    constructor(data: any) {
        const parameterContainer = new ParameterContainer(data);
        this.loggingProperties = LoggingProperties.withFirst(parameterContainer, "ChangeFineFunction.constructor", {data: data}, "notice");
        this.parameters = ChangeFineFunction.parseParameters(parameterContainer, this.loggingProperties.nextIndent);
    }

    /**
     * Parses parameters for this function from a parameter container.
     * @param {ParameterContainer} container Parameter container to get parameters from.
     * @return {FunctionParameters} Parsed parameters for this function.
     */
    private static parseParameters(container: ParameterContainer, loggingProperties: LoggingProperties): ChangeFineFunction.Parameters {
        loggingProperties.append("ChangeFineFunction.parseParameter", {container: container});
        return {
            privateKey: container.getParameter("privateKey", "string", loggingProperties.nextIndent),
            clubLevel: new ClubLevel.Builder().fromParameterContainer(container, "clubLevel", loggingProperties.nextIndent),
            clubId: guid.fromParameterContainer(container, "clubId", loggingProperties.nextIndent),
            changeType: new ChangeType.Builder().fromParameterContainer(container, "changeType", loggingProperties.nextIndent),
            updatableFine: getUpdatable<Fine | Deleted, Fine.Builder>(container.getParameter("fine", "object", loggingProperties.nextIndent), new Fine.Builder(), loggingProperties.nextIndent),
        };
    }

    private getFineRef(): Reference {
        const clubPath = `${this.parameters.clubLevel.clubComponent}/${this.parameters.clubId.guidString}`;
        const finePath = `${clubPath}/fines/${this.parameters.updatableFine.property.id.guidString}`;
        return admin.database().ref(finePath);
    }

    /**
     * Executes this firebase function.
     * @param {{uid: string} | undefined} auth Authentication state.
     */
    async executeFunction(auth?: { uid: string }): Promise<void> {
        this.loggingProperties.append("ChangeFineFunction.executeFunction", {auth: auth}, "info");

        // Check prerequirements
        const clubPath = `${this.parameters.clubLevel.clubComponent}/${this.parameters.clubId.guidString}`;
        await checkPrerequirements(this.parameters, this.loggingProperties.nextIndent, auth, this.parameters.clubId);

        // Check update timestamp
        await checkUpdateTimestamp(`${clubPath}/fines/${this.parameters.updatableFine.property.id.guidString}/updateProperties`, this.parameters.updatableFine.updateProperties, this.loggingProperties.nextIndent);

        // Get previous fine
        const fineRef = this.getFineRef();
        const fineSnapshot = await fineRef.once("value");
        let previousFine: Fine.Statistic | null = null;
        if (fineSnapshot.exists()) {
            const previousRawFine = new Fine.Builder().fromSnapshot(fineSnapshot, this.loggingProperties.nextIndent);
            if (previousRawFine instanceof Fine)
                previousFine = await previousRawFine.forStatistics(clubPath, this.loggingProperties.nextIndent);
        }

        // Change fine
        let changedFine: Fine.Statistic | null = null;
        switch (this.parameters.changeType.value) {
        case "delete":
            await this.deleteItem();
            break;

        case "update":
            if (!(this.parameters.updatableFine.property instanceof Fine))
                throw httpsError("invalid-argument", "Fine property isn't from type 'Fine'.", this.loggingProperties);
            await this.updateItem();
            changedFine = await this.parameters.updatableFine.property.forStatistics(clubPath, this.loggingProperties.nextIndent);
            break;
        }

        // Save statistic
        await saveStatistic(clubPath, {
            name: "changeFine",
            properties: new ChangeFineFunction.Statistic(previousFine, changedFine),
        }, this.loggingProperties.nextIndent);
    }

    private async deleteItem(): Promise<void> {
        this.loggingProperties.append("ChangeFineFunction.deleteItem");
        if (!(this.parameters.updatableFine.property instanceof Deleted))
            throw httpsError("invalid-argument", "Fine property isn't from type 'Deleted'.", this.loggingProperties);
        const fineRef = this.getFineRef();
        if (await existsData(fineRef)) {
            await fineRef.set(this.parameters.updatableFine.serverObject, error => {
                if (error != null)
                    throw httpsError("internal", `Couldn't delete fine, underlying error: ${error.name}, ${error.message}`, this.loggingProperties);
            });
        }
    }

    private async updateItem(): Promise<void> {
        this.loggingProperties.append("ChangeFineFunction.updateItem");
        const fineRef = this.getFineRef();
        await fineRef.set(this.parameters.updatableFine.serverObject, error => {
            if (error != null)
                throw httpsError("internal", `Couldn't update fine, underlying error: ${error.name}, ${error.message}`, this.loggingProperties);
        });
    }
}

export namespace ChangeFineFunction {

    export type Parameters = FunctionDefaultParameters & {
        clubId: guid,
        changeType: ChangeType,
        updatableFine: Updatable<Fine | Deleted>
    }

    export class Statistic implements StatisticsProperties<Statistic.ServerObject> {

        public constructor(
            public readonly previousFine: Fine.Statistic | null,
            public readonly changedFine: Fine.Statistic | null
        ) {}

        public get ["serverObject"](): Statistic.ServerObject {
            return {
                previousFine: undefinedAsNull(this.previousFine?.serverObject),
                changedFine: undefinedAsNull(this.changedFine?.serverObject),
            };
        }
    }

    export namespace Statistic {

        export interface ServerObject {
            previousFine: Fine.Statistic.ServerObject | null;
            changedFine: Fine.Statistic.ServerObject | null;
        }
    }
}
