import * as admin from "firebase-admin";
import { ChangeType } from "../TypeDefinitions/ChangeType";
import { ClubLevel } from "../TypeDefinitions/ClubLevel";
import { guid} from "../TypeDefinitions/guid";
import { ParameterContainer } from "../TypeDefinitions/ParameterContainer";
import { Reference} from "@firebase/database-types";
import { checkPrerequirements, checkUpdateTimestamp, Deleted, existsData, FirebaseFunction, FunctionDefaultParameters, httpsError, saveStatistic, StatisticsProperties } from "../utils";
import { LatePaymentInterest } from "../TypeDefinitions/LatePaymentInterest";
import { LoggingProperties } from "../TypeDefinitions/LoggingProperties";
import { getUpdatable, Updatable } from "../TypeDefinitions/UpdateProperties";

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
 *  - clubLevel ({@link ClubLevel}}): level of the club (`regular`, `debug`, `testing`)
 *  - clubId ({@link guid}): id of the club to change the late payment interest
 *  - changeType ({@link ChangeType}}): type of the change (`update`, `delete`)
 *  - latePaymentInterest ({@link Updatable}<{@link LatePaymentInterest} | {@link Deleted}>): interest to change
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
    private parameters: ChangeLatePaymentInterestFunction.Parameters;

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
    private static parseParameters(container: ParameterContainer, loggingProperties: LoggingProperties): ChangeLatePaymentInterestFunction.Parameters {
        loggingProperties.append("ChangeLatePaymentInterestFunction.parseParameter", {container: container});
        return {
            privateKey: container.getParameter("privateKey", "string", loggingProperties.nextIndent),
            clubLevel: new ClubLevel.Builder().fromParameterContainer(container, "clubLevel", loggingProperties.nextIndent),
            clubId: guid.fromParameterContainer(container, "clubId", loggingProperties.nextIndent),
            changeType: new ChangeType.Builder().fromParameterContainer(container, "changeType", loggingProperties.nextIndent),
            updatableInterest: getUpdatable<LatePaymentInterest | Deleted<null>, LatePaymentInterest.Builder>(container.getParameter("latePaymentInterest", "object", loggingProperties.nextIndent), new LatePaymentInterest.Builder(), loggingProperties.nextIndent),
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

        // Check update timestamp
        await checkUpdateTimestamp(`${clubPath}/latePaymentInterest/updateProperties`, this.parameters.updatableInterest.updateProperties, this.loggingProperties.nextIndent);

        // Get previous interest
        const interestRef = this.getInterestRef();
        const interestSnapshot = await interestRef.once("value");
        let previousInterest: LatePaymentInterest | null = null;
        if (interestSnapshot.exists()) {
            const previousRawInterest = new LatePaymentInterest.Builder().fromSnapshot(interestSnapshot, this.loggingProperties.nextIndent);
            if (previousRawInterest instanceof LatePaymentInterest)
                previousInterest = previousRawInterest;
        }

        // Change interest
        let changedInterest: LatePaymentInterest | null = null;
        switch (this.parameters.changeType.value) {
        case "delete":
            await this.deleteItem();
            break;

        case "update":
            if (!(this.parameters.updatableInterest.property instanceof LatePaymentInterest))
                throw httpsError("invalid-argument", "LatePaymentInterest property isn't from type 'LatePaymentInterest'.", this.loggingProperties);
            await this.updateItem();
            changedInterest = this.parameters.updatableInterest.property;
            break;
        }
        // Save statistic
        await saveStatistic(clubPath, {
            name: "changeLatePaymentInterest",
            properties: new ChangeLatePaymentInterestFunction.Statistic(previousInterest, changedInterest),
        }, this.loggingProperties.nextIndent);
    }

    private async deleteItem(): Promise<void> {
        this.loggingProperties.append("ChangeLatePaymentInterestFunction.deleteItem");
        if (!(this.parameters.updatableInterest.property instanceof Deleted))
            throw httpsError("invalid-argument", "LatePaymentInterest property isn't from type 'Deleted'.", this.loggingProperties);
        const interestRef = this.getInterestRef();
        if (await existsData(interestRef)) {
            await interestRef.set(this.parameters.updatableInterest.serverObject, error => {
                if (error != null)
                    throw httpsError("internal", `Couldn't delete late payment interest, underlying error: ${error.name}, ${error.message}`, this.loggingProperties);
            });
        }
    }

    private async updateItem(): Promise<void> {
        this.loggingProperties.append("ChangeLatePaymentInterestFunction.updateItem");
        const interestRef = this.getInterestRef();
        await interestRef.set(this.parameters.updatableInterest.serverObject, error => {
            if (error != null)
                throw httpsError("internal", `Couldn't update delete late payment interest, underlying error: ${error.name}, ${error.message}`, this.loggingProperties);
        });
    }
}

export namespace ChangeLatePaymentInterestFunction {

    export type Parameters = FunctionDefaultParameters & {
        clubId: guid,
        changeType: ChangeType,
        updatableInterest: Updatable<LatePaymentInterest | Deleted<null>>
    }

    export class Statistic implements StatisticsProperties<Statistic.ServerObject> {

        constructor(
            public readonly previousInterest: LatePaymentInterest | null,
            public readonly changedInterest: LatePaymentInterest | null
        ) {}

        get ["serverObject"](): Statistic.ServerObject {
            return {
                previousInterest: this.previousInterest,
                changedInterest: this.changedInterest,
            };
        }
    }

    export namespace Statistic {

        export interface ServerObject {
            previousInterest: LatePaymentInterest | null;
            changedInterest: LatePaymentInterest | null;
        }
    }
}
