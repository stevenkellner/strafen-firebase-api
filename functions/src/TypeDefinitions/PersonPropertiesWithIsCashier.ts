import { httpsError } from "../utils";
import { guid } from "./guid";
import { LoggingProperties } from "./LoggingProperties";
import { ParameterContainer } from "./ParameterContainer";
import { PersonName } from "./PersonName";

export class PersonPropertiesWithIsCashier {
    public constructor(
        public readonly id: guid,
        public readonly signInDate: Date,
        public readonly isCashier: boolean,
        public readonly name: PersonName
    ) {}

    public get ["serverObject"](): PersonPropertiesWithIsCashier.ServerObject {
        return {
            id: this.id.guidString,
            signInDate: this.signInDate.toISOString(),
            isCashier: this.isCashier,
            name: this.name.serverObject,
        };
    }
}

export namespace PersonPropertiesWithIsCashier {

    export interface ServerObject {
        id: string,
        signInDate: string,
        isCashier: boolean,
        name: PersonName.ServerObject
    }

    export class Builder {

        public fromValue(value: any, loggingProperties: LoggingProperties): PersonPropertiesWithIsCashier {
            loggingProperties.append("PersonProperties.Builder.fromValue", {value: value});

            // Check if value is from type object
            if (typeof value !== "object")
                throw httpsError("invalid-argument", `Couldn't parse person properties, expected type 'object', but bot ${value} from type '${typeof value}'`, loggingProperties);

            // Check if type of id is string
            if (typeof value.id !== "string")
                throw httpsError("invalid-argument", `Couldn't parse person properties parameter 'id'. Expected type 'string', but got '${value.id}' from type '${typeof value.id}'.`, loggingProperties);
            const id = guid.fromString(value.id, loggingProperties.nextIndent);

            // Check if type of sign in date is string
            if (typeof value.signInDate !== "string")
                throw httpsError("invalid-argument", `Couldn't parse person properties parameter 'signInDate'. Expected type 'string', but got '${value.id}' from type '${typeof value.id}'.`, loggingProperties);
            const signInDate = new Date(value.signInDate);

            // Check if type of isCashier is boolean
            if (typeof value.isCashier !== "boolean")
                throw httpsError("invalid-argument", `Couldn't parse person properties parameter 'isCashier'. Expected type 'boolean', but got '${value.id}' from type '${typeof value.id}'.`, loggingProperties);

            // Check if type of name is object
            if (typeof value.name !== "object")
                throw httpsError("invalid-argument", `Couldn't parse person properties parameter 'name'. Expected type 'object', but got '${value.id}' from type '${typeof value.id}'.`, loggingProperties);
            const name = new PersonName.Builder().fromValue(value.name, loggingProperties.nextIndent);

            // Return person properties
            return new PersonPropertiesWithIsCashier(id, signInDate, value.isCashier, name);
        }

        public fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties: LoggingProperties): PersonPropertiesWithIsCashier {
            loggingProperties.append("PersonProperties.Builder.fromParameterContainer", {container: container, parameterName: parameterName});
            return this.fromValue(container.getParameter(parameterName, "object", loggingProperties.nextIndent), loggingProperties.nextIndent);
        }
    }
}
