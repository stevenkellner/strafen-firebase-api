import {checkPrerequirements, FunctionDefaultParameters, FirebaseFunction, existsData, saveStatistic, StatisticsProperties, undefinedAsNull} from "../utils";
import {ParameterContainer} from "../TypeDefinitions/ParameterContainer";
import {guid} from "../TypeDefinitions/guid";
import {ClubLevel} from "../TypeDefinitions/ClubLevel";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {ReasonTemplate, ReasonTemplateObject} from "../TypeDefinitions/ReasonTemplate";
import {ChangeType} from "../TypeDefinitions/ChangeType";
import {Reference} from "@firebase/database-types";
import {DataSnapshot} from "firebase/database";
import {TypeOrId} from "../TypeDefinitions/TypeOrId";

/**
 * Type of Parameters for ChangeReasonTemplateFunction
 */
type FunctionParameters = FunctionDefaultParameters & { clubId: guid, changeType: ChangeType, reasonTemplate: ReasonTemplate }

interface FunctionStatisticsPropertiesObject {
    previousReasonTemplate: ReasonTemplateObject | null;
    changedReasonTemplate: ReasonTemplateObject | { id: string };
}

class FunctionStatisticsProperties implements StatisticsProperties<FunctionStatisticsPropertiesObject> {
    readonly previousReasonTemplate: ReasonTemplate | null;
    readonly changedReasonTemplate: TypeOrId<ReasonTemplate, ReasonTemplateObject>;

    constructor(previousReasonTemplate: ReasonTemplate | null, changedReasonTemplate: TypeOrId<ReasonTemplate, ReasonTemplateObject>) {
        this.previousReasonTemplate = previousReasonTemplate;
        this.changedReasonTemplate = changedReasonTemplate;
    }

    get ["object"](): FunctionStatisticsPropertiesObject {
        return {
            previousReasonTemplate: undefinedAsNull(this.previousReasonTemplate?.object),
            changedReasonTemplate: this.changedReasonTemplate.object,
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
 *      - changedReasonTemplate ({@link ReasonTemplate} | { id: guid; }): Changed reason template or only id if change type is `delete`
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - clubLevel ({@link ClubLevel}): level of the club change
 *  - clubId ({@link guid}): id of the club to force sign out the person
 *  - changeType ({@link ChangeType}}): type of the change
 *  - reasonTemplate ({@link ReasonTemplate}): reason template to change or null if change type is `delete`
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

    /**
     * Initilizes function with given over data.
     * @param {any} data Data to get parameters from.
     */
    constructor(data: any) {
        const parameterContainer = new ParameterContainer(data);
        this.parameters = ChangeReasonTemplateFunction.parseParameters(parameterContainer);
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
            reasonTemplate: ReasonTemplate.fromParameterContainer(container, "reasonTemplate"),
        };
    }

    private getReasonTemplateRef(): Reference {
        const clubPath = `${this.parameters.clubLevel.getClubComponent()}/${this.parameters.clubId.guidString}`;
        const reasonTemplatePath = `${clubPath}/reasonTemplates/${this.parameters.reasonTemplate.id.guidString}`;
        return admin.database().ref(reasonTemplatePath);
    }

    /**
     * Executes this firebase function.
     * @param {{uid: string} | undefined} auth Authentication state.
     */
    async executeFunction(auth?: { uid: string }): Promise<void> {

        // Check prerequirements
        await checkPrerequirements(this.parameters, auth, this.parameters.clubId);

        // Get previous reason template
        const reasonTemplateRef = this.getReasonTemplateRef();
        const reasonTemplateSnapshot = await reasonTemplateRef.once("value");
        let previousReasonTemplate: ReasonTemplate | null = null;
        if (reasonTemplateSnapshot.exists())
            previousReasonTemplate = ReasonTemplate.fromSnapshot(reasonTemplateSnapshot as unknown as DataSnapshot);

        // Change reason template
        let changedReasonTemplate: TypeOrId<ReasonTemplate, ReasonTemplateObject>;
        switch (this.parameters.changeType.value) {
        case "delete":
            await this.deleteItem();
            changedReasonTemplate = TypeOrId.onlyId(this.parameters.reasonTemplate.id);
            break;

        case "update":
            await this.updateItem();
            changedReasonTemplate = TypeOrId.withType(this.parameters.reasonTemplate);
            break;
        }

        // Save statistic
        const clubPath = `${this.parameters.clubLevel.getClubComponent()}/${this.parameters.clubId.guidString}`;
        await saveStatistic(clubPath, {
            name: "changeReasonTemplate",
            properties: new FunctionStatisticsProperties(previousReasonTemplate, changedReasonTemplate),
        });
    }

    private async deleteItem(): Promise<void> {
        const reasonTemplateRef = this.getReasonTemplateRef();
        if (await existsData(reasonTemplateRef)) {
            await reasonTemplateRef.remove(error => {
                if (error != null)
                    throw new functions.https.HttpsError("internal", `Couldn't delete reason template, underlying error: ${error.name}, ${error.message}`);
            });
        }
    }

    private async updateItem(): Promise<void> {
        const reasonTemplateRef = this.getReasonTemplateRef();
        await reasonTemplateRef.set(this.parameters.reasonTemplate?.objectWithoutId, error => {
            if (error != null)
                throw new functions.https.HttpsError("internal", `Couldn't update reason template, underlying error: ${error.name}, ${error.message}`);
        });
    }
}
