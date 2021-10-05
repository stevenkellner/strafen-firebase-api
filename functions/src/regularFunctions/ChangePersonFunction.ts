import {ChangeType} from "../TypeDefinitions/ChangeType";
import {ClubLevel} from "../TypeDefinitions/ClubLevel";
import {guid} from "../TypeDefinitions/guid";
import {ParameterContainer} from "../TypeDefinitions/ParameterContainer";
import {Person, PersonObject} from "../TypeDefinitions/Person";
import * as admin from "firebase-admin";
import {Reference} from "@firebase/database-types";
import {checkPrerequirements, existsData, FirebaseFunction, FunctionDefaultParameters, httpsError, saveStatistic, StatisticsProperties, undefinedAsNull, UpdateProperties} from "../utils";
import { LoggingProperties } from "../TypeDefinitions/LoggingProperties";

/**
 * Type of Parameters for ChangePersonFunction
 */
 type FunctionParameters = FunctionDefaultParameters & { updateProperties: UpdateProperties, clubId: guid, changeType: ChangeType, person: Person }

 interface FunctionStatisticsPropertiesObject {
    previousPerson: PersonObject | null;
    changedPerson: PersonObject | null;
 }

class FunctionStatisticsProperties implements StatisticsProperties<FunctionStatisticsPropertiesObject> {
     readonly previousPerson: Person | null;
     readonly changedPerson: Person | null;

     constructor(previousPerson: Person | null, changedPerson: Person | null) {
         this.previousPerson = previousPerson;
         this.changedPerson = changedPerson;
     }

     get ["object"](): FunctionStatisticsPropertiesObject {
         return {
             previousPerson: undefinedAsNull(this.previousPerson?.object),
             changedPerson: undefinedAsNull(this.changedPerson?.object),
         };
     }
}

/**
 * @summary
 * Changes a element of person list.
 *
 * Saved statistik:
 *  - name: changePerson
 *  - properties:
 *      - previousPerson ({@link Person} | null): Previous person to change
 *      - changedPerson ({@link Person} | null): Changed person or null if change type is `delete`
 *
 * @params
 *  - privateKey (string): private key to check whether the caller is authenticated to use this function
 *  - clubLevel ({@link ClubLevel}): level of the club change
 *  - clubId ({@link guid}): id of the club to force sign out the person
 *  - changeType ({@link ChangeType}}): type of the change
 *  - person ({@link Person}): person to change
 *
 * @throws
 *  - {@link functions.https.HttpsError}:
 *    - permission-denied: if private key isn't valid or the function is called while unauthendicated
 *    - invalid-argument: if a required parameter isn't give over or if a parameter hasn't the right type
 *    - unavailable: if person is already signed in
 *    - internal: if couldn't change person in database
 */
export class ChangePersonFunction implements FirebaseFunction {

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
        this.loggingProperties = LoggingProperties.withFirst(parameterContainer, "ChangePersonFunction.constructor", {data: data}, "notice");
        this.parameters = ChangePersonFunction.parseParameters(parameterContainer, this.loggingProperties.nextIndent);
    }

    /**
     * Parses parameters for this function from a parameter container.
     * @param {ParameterContainer} container Parameter container to get parameters from.
     * @return {FunctionParameters} Parsed parameters for this function.
     */
    private static parseParameters(container: ParameterContainer, loggingProperties?: LoggingProperties): FunctionParameters {
        loggingProperties?.append("ChangePersonFunction.parseParameter", {container: container});
        return {
            privateKey: container.getParameter("privateKey", "string", loggingProperties?.nextIndent),
            clubLevel: ClubLevel.fromParameterContainer(container, "clubLevel", loggingProperties?.nextIndent),
            clubId: guid.fromParameterContainer(container, "clubId", loggingProperties?.nextIndent),
            changeType: ChangeType.fromParameterContainer(container, "changeType", loggingProperties?.nextIndent),
            person: Person.fromParameterContainer(container, "person", loggingProperties?.nextIndent),
            updateProperties: UpdateProperties.fromParameterContainer(container, "updateProperties", loggingProperties?.nextIndent),
        };
    }

    private getPersonRef(): Reference {
        const clubPath = `${this.parameters.clubLevel.getClubComponent()}/${this.parameters.clubId.guidString}`;
        const personPath = `${clubPath}/persons/${this.parameters.person.id.guidString}`;
        return admin.database().ref(personPath);
    }

    /**
     * Executes this firebase function.
     * @param {{uid: string} | undefined} auth Authentication state.
     */
    async executeFunction(auth?: { uid: string }): Promise<void> {
        this.loggingProperties?.append("ChangePersonFunction.executeFunction", {auth: auth}, "info");

        // Check prerequirements
        const clubPath = `${this.parameters.clubLevel.getClubComponent()}/${this.parameters.clubId.guidString}`;
        await checkPrerequirements(this.parameters, this.loggingProperties.nextIndent, auth, this.parameters.clubId);

        // Get previous person
        const personRef = this.getPersonRef();
        const personSnapshot = await personRef.once("value");
        let previousPerson: Person | null = null;
        if (personSnapshot.exists())
            previousPerson = Person.fromSnapshot(personSnapshot, this.loggingProperties.nextIndent);

        // Change person
        let changedPerson: Person | null = null;
        switch (this.parameters.changeType.value) {
        case "delete":
            await this.deleteItem();
            break;

        case "update":
            await this.updateItem();
            changedPerson = this.parameters.person;
            break;
        }

        // Save statistic
        await saveStatistic(clubPath, {
            name: "changePerson",
            properties: new FunctionStatisticsProperties(previousPerson, changedPerson),
        }, this.loggingProperties.nextIndent);
    }

    private async deleteItem(): Promise<void> {
        this.loggingProperties?.append("ChangePersonFunction.deleteItem");

        // Check if person to delete is already signed in
        const personRef = this.getPersonRef();
        if (await existsData(personRef.child("signInData")))
            throw httpsError("unavailable", "Person is already signed in!", this.loggingProperties.nextIndent);

        if (await existsData(personRef)) {
            await personRef.remove(error => {
                if (error != null)
                    throw httpsError("internal", `Couldn't delete person, underlying error: ${error.name}, ${error.message}`, this.loggingProperties.nextIndent);
            });
        }
    }

    private async updateItem(): Promise<void> {
        this.loggingProperties?.append("ChangePersonFunction.updateItem");
        const personRef = this.getPersonRef();
        await personRef.set(this.parameters.person?.objectWithoutId, error => {
            if (error != null)
                throw httpsError("internal", `Couldn't update person, underlying error: ${error.name}, ${error.message}`, this.loggingProperties.nextIndent);
        });
    }
}
