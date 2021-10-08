import * as admin from "firebase-admin";
import { checkPrerequirements, FunctionDefaultParameters, FirebaseFunction, existsData, saveStatistic, StatisticsProperties, undefinedAsNull, httpsError } from "../utils";
import { ParameterContainer } from "../TypeDefinitions/ParameterContainer";
import { guid } from "../TypeDefinitions/guid";
import { ClubLevel } from "../TypeDefinitions/ClubLevel";
import { ReasonTemplate } from "../TypeDefinitions/ReasonTemplate";
import { ChangeType } from "../TypeDefinitions/ChangeType";
import { Reference } from "@firebase/database-types";
import { DataSnapshot } from "firebase/database";
import { LoggingProperties } from "../TypeDefinitions/LoggingProperties";

/**
 * Type of Parameters for ChangeReasonTemplateFunction
 */
type FunctionParameters = FunctionDefaultParameters & { clubId: guid, changeType: ChangeType, reasonTemplate: ReasonTemplate }

interface FunctionStatisticsPropertiesObject {
    previousReasonTemplate: ReasonTemplate.ServerObject | null;
    changedReasonTemplate: ReasonTemplate.ServerObject | null;
}

class FunctionStatisticsProperties implements StatisticsProperties<FunctionStatisticsPropertiesObject> {
    readonly previousReasonTemplate: ReasonTemplate | null;
    readonly changedReasonTemplate: ReasonTemplate | null;

    constructor(previousReasonTemplate: ReasonTemplate | null, changedReasonTemplate: ReasonTemplate | null) {
        this.previousReasonTemplate = previousReasonTemplate;
        this.changedReasonTemplate = changedReasonTemplate;
    }

    get ["serverObject"](): FunctionStatisticsPropertiesObject {
        return {
            previousReasonTemplate: undefinedAsNull(this.previousReasonTemplate?.serverObject),
            changedReasonTemplate: undefinedAsNull(this.changedReasonTemplate?.serverObject),
        };
    }
}

/**
 * @summary
 * Changes a element of reason template list.
 *
 * Saved statistik:
 *  - name: changeReasonTemplate
 *  - properties:
 *      - previousReasonTemplate ({@link ReasonTemplate} | null): Previous reason template to change
 *      - changedReasonTemplate ({@link ReasonTemplate} | null: Changed reason template or only id if change type is `delete`
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - clubLevel ({@link ClubLevel}): level of the club change
 *  - clubId ({@link guid}): id of the club to force sign out the person
 *  - changeType ({@link ChangeType}}): type of the change
 *  - reasonTemplate ({@link ReasonTemplate}): reason template to change
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - internal: if couldn't change reason template in database
 */
export class ChangeReasonTemplateFunction implements FirebaseFunction {

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
        this.loggingProperties = LoggingProperties.withFirst(parameterContainer, "ChangeReasonTemplateFunction.constructor", {data: data}, "notice");
        this.parameters = ChangeReasonTemplateFunction.parseParameters(parameterContainer, this.loggingProperties.nextIndent);
    }

    /**
     * Parses parameters for this function from a parameter container.
     * @param {ParameterContainer} container Parameter container to get parameters from.
     * @return {FunctionParameters} Parsed parameters for this function.
     */
    private static parseParameters(container: ParameterContainer, loggingProperties?: LoggingProperties): FunctionParameters {
        loggingProperties?.append("ChangeReasonTemplateFunction.parseParameter", {container: container});
        return {
            privateKey: container.getParameter("privateKey", "string", loggingProperties?.nextIndent),
            clubLevel: new ClubLevel.Builder().fromParameterContainer(container, "clubLevel", loggingProperties?.nextIndent),
            clubId: guid.fromParameterContainer(container, "clubId", loggingProperties?.nextIndent),
            changeType: new ChangeType.Builder().fromParameterContainer(container, "changeType", loggingProperties?.nextIndent),
            reasonTemplate: new ReasonTemplate.Builder().fromParameterContainer(container, "reasonTemplate", loggingProperties?.nextIndent),
        };
    }

    private getReasonTemplateRef(): Reference {
        const clubPath = `${this.parameters.clubLevel.clubComponent}/${this.parameters.clubId.guidString}`;
        const reasonTemplatePath = `${clubPath}/reasonTemplates/${this.parameters.reasonTemplate.id.guidString}`;
        return admin.database().ref(reasonTemplatePath);
    }

    /**
     * Executes this firebase function.
     * @param {{uid: string} | undefined} auth Authentication state.
     */
    async executeFunction(auth?: { uid: string }): Promise<void> {
        this.loggingProperties?.append("ChangeReasonTemplateFunction.executeFunction", {auth: auth}, "info");

        // Check prerequirements
        await checkPrerequirements(this.parameters, this.loggingProperties.nextIndent, auth, this.parameters.clubId);

        // Get previous reason template
        const reasonTemplateRef = this.getReasonTemplateRef();
        const reasonTemplateSnapshot = await reasonTemplateRef.once("value");
        let previousReasonTemplate: ReasonTemplate | null = null;
        if (reasonTemplateSnapshot.exists())
            previousReasonTemplate = new ReasonTemplate.Builder().fromSnapshot(reasonTemplateSnapshot as unknown as DataSnapshot, this.loggingProperties.nextIndent);

        // Change reason template
        let changedReasonTemplate: ReasonTemplate | null = null;
        switch (this.parameters.changeType.value) {
        case "delete":
            await this.deleteItem();
            break;

        case "update":
            await this.updateItem();
            changedReasonTemplate = this.parameters.reasonTemplate;
            break;
        }

        // Save statistic
        const clubPath = `${this.parameters.clubLevel.clubComponent}/${this.parameters.clubId.guidString}`;
        await saveStatistic(clubPath, {
            name: "changeReasonTemplate",
            properties: new FunctionStatisticsProperties(previousReasonTemplate, changedReasonTemplate),
        }, this.loggingProperties.nextIndent);
    }

    private async deleteItem(): Promise<void> {
        this.loggingProperties?.append("ChangeReasonTemplateFunction.deleteItem");
        const reasonTemplateRef = this.getReasonTemplateRef();
        if (await existsData(reasonTemplateRef)) {
            await reasonTemplateRef.remove(error => {
                if (error != null)
                    throw httpsError("internal", `Couldn't delete reason template, underlying error: ${error.name}, ${error.message}`, this.loggingProperties);
            });
        }
    }

    private async updateItem(): Promise<void> {
        this.loggingProperties?.append("ChangeReasonTemplateFunction.updateItem");
        const reasonTemplateRef = this.getReasonTemplateRef();
        await reasonTemplateRef.set(this.parameters.reasonTemplate?.serverObjectWithoutId, error => {
            if (error != null)
                throw httpsError("internal", `Couldn't update reason template, underlying error: ${error.name}, ${error.message}`, this.loggingProperties);
        });
    }
}
