import * as admin from "firebase-admin";
import { checkPrerequirements, FunctionDefaultParameters, FirebaseFunction, existsData, saveStatistic, StatisticsProperties, undefinedAsNull, httpsError, checkUpdateTimestamp, Deleted } from "../utils";
import { ParameterContainer } from "../TypeDefinitions/ParameterContainer";
import { guid } from "../TypeDefinitions/guid";
import { ClubLevel } from "../TypeDefinitions/ClubLevel";
import { ChangeType } from "../TypeDefinitions/ChangeType";
import { Reference } from "@firebase/database-types";
import { Person } from "../TypeDefinitions/Person";
import { LoggingProperties } from "../TypeDefinitions/LoggingProperties";
import { getUpdatable, Updatable } from "../TypeDefinitions/UpdateProperties";

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
 *  - person ({@link Person}<{@link Person} | {@link Deleted}>): person to change
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
    private parameters: ChangePersonFunction.Parameters;

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
    private static parseParameters(container: ParameterContainer, loggingProperties: LoggingProperties): ChangePersonFunction.Parameters {
        loggingProperties.append("ChangePersonFunction.parseParameter", {container: container});
        return {
            privateKey: container.getParameter("privateKey", "string", loggingProperties.nextIndent),
            clubLevel: new ClubLevel.Builder().fromParameterContainer(container, "clubLevel", loggingProperties.nextIndent),
            clubId: guid.fromParameterContainer(container, "clubId", loggingProperties.nextIndent),
            changeType: new ChangeType.Builder().fromParameterContainer(container, "changeType", loggingProperties.nextIndent),
            updatablePerson: getUpdatable<Person | Deleted<guid>, Person.Builder>(container.getParameter("person", "object", loggingProperties.nextIndent), new Person.Builder(), loggingProperties.nextIndent),
        };
    }

    private getPersonRef(): Reference {
        const clubPath = `${this.parameters.clubLevel.clubComponent}/${this.parameters.clubId.guidString}`;
        const personPath = `${clubPath}/persons/${this.parameters.updatablePerson.property.id.guidString}`;
        return admin.database().ref(personPath);
    }

    /**
     * Executes this firebase function.
     * @param {{uid: string} | undefined} auth Authentication state.
     */
    async executeFunction(auth?: { uid: string }): Promise<void> {
        this.loggingProperties.append("ChangePersonFunction.executeFunction", {auth: auth}, "info");

        // Check prerequirements
        const clubPath = `${this.parameters.clubLevel.clubComponent}/${this.parameters.clubId.guidString}`;
        await checkPrerequirements(this.parameters, this.loggingProperties.nextIndent, auth, this.parameters.clubId);

        // Check update timestamp
        await checkUpdateTimestamp(`${clubPath}/persons/${this.parameters.updatablePerson.property.id.guidString}/updateProperties`, this.parameters.updatablePerson.updateProperties, this.loggingProperties.nextIndent);

        // Get previous person
        const personRef = this.getPersonRef();
        const personSnapshot = await personRef.once("value");
        let previousPerson: Person | null = null;
        if (personSnapshot.exists()) {
            const previousRawPerson = new Person.Builder().fromSnapshot(personSnapshot, this.loggingProperties.nextIndent);
            if (previousRawPerson instanceof Person)
                previousPerson = previousRawPerson;
        }

        // Change person
        let changedPerson: Person | null = null;
        switch (this.parameters.changeType.value) {
        case "delete":
            await this.deleteItem();
            break;

        case "update":
            if (!(this.parameters.updatablePerson.property instanceof Person))
                throw httpsError("invalid-argument", "Person property isn't from type 'Person'.", this.loggingProperties);
            await this.updateItem();
            changedPerson = this.parameters.updatablePerson.property;
            break;
        }

        // Save statistic
        await saveStatistic(clubPath, {
            name: "changePerson",
            properties: new ChangePersonFunction.Statistic(previousPerson, changedPerson),
        }, this.loggingProperties.nextIndent);
    }

    private async deleteItem(): Promise<void> {
        this.loggingProperties.append("ChangePersonFunction.deleteItem");
        if (!(this.parameters.updatablePerson.property instanceof Deleted))
            throw httpsError("invalid-argument", "Person property isn't from type 'Deleted'.", this.loggingProperties);

        // Check if person to delete is already signed in
        const personRef = this.getPersonRef();
        if (await existsData(personRef.child("signInData")))
            throw httpsError("unavailable", "Person is already signed in!", this.loggingProperties);

        if (await existsData(personRef)) {
            await personRef.set(this.parameters.updatablePerson.serverObject, error => {
                if (error != null)
                    throw httpsError("internal", `Couldn't delete person, underlying error: ${error.name}, ${error.message}`, this.loggingProperties);
            });
        }
    }

    private async updateItem(): Promise<void> {
        this.loggingProperties.append("ChangePersonFunction.updateItem");
        const personRef = this.getPersonRef();
        await personRef.set(this.parameters.updatablePerson.serverObject, error => {
            if (error != null)
                throw httpsError("internal", `Couldn't update person, underlying error: ${error.name}, ${error.message}`, this.loggingProperties);
        });
    }
}

export namespace ChangePersonFunction {

    export type Parameters = FunctionDefaultParameters & {
        clubId: guid,
        changeType: ChangeType,
        updatablePerson: Updatable<Person | Deleted<guid>>
    }

    export class Statistic implements StatisticsProperties<Statistic.ServerObject> {

        public constructor(
            public readonly previousPerson: Person | null,
            public readonly changedPerson: Person | null
        ) {}

        public get ["serverObject"](): Statistic.ServerObject {
            return {
                previousPerson: undefinedAsNull(this.previousPerson?.serverObject),
                changedPerson: undefinedAsNull(this.changedPerson?.serverObject),
            };
        }
    }

    export namespace Statistic {

        export interface ServerObject {
            previousPerson: Person.ServerObject | null;
            changedPerson: Person.ServerObject | null;
        }
    }
}
