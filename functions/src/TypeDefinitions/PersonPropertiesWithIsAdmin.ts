import { httpsError } from "../utils";
import { guid } from "./guid";
import { LoggingProperties } from "./LoggingProperties";
import { ParameterContainer } from "./ParameterContainer";
import { PersonName } from "./PersonName";

export class PersonPropertiesWithIsAdmin {
    public constructor(
        public readonly id: guid,
        public readonly signInDate: Date,
        public readonly isAdmin: boolean,
        public readonly name: PersonName
    ) {}

    public get ["serverObject"](): PersonPropertiesWithIsAdmin.ServerObject {
        return {
            id: this.id.guidString,
            signInDate: this.signInDate.toISOString(),
            isAdmin: this.isAdmin,
            name: this.name.serverObject,
        };
    }
}

export namespace PersonPropertiesWithIsAdmin {

    export interface ServerObject {
        id: string,
        signInDate: string,
        isAdmin: boolean,
        name: PersonName.ServerObject
    }

    export class Builder {

        public fromValue(value: any, loggingProperties: LoggingProperties): PersonPropertiesWithIsAdmin {
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
                throw httpsError("invalid-argument", `Couldn't parse person properties parameter 'signInDate'. Expected type 'string', but got '${value.signInDate}' from type '${typeof value.signInDate}'.`, loggingProperties);
            const signInDate = new Date(value.signInDate);

            // Check if type of isAdmin is boolean
            if (typeof value.isAdmin !== "boolean")
                throw httpsError("invalid-argument", `Couldn't parse person properties parameter 'isAdmin'. Expected type 'boolean', but got '${value.isAdmin}' from type '${typeof value.isAdmin}'.`, loggingProperties);

            // Check if type of name is object
            if (typeof value.name !== "object")
                throw httpsError("invalid-argument", `Couldn't parse person properties parameter 'name'. Expected type 'object', but got '${value.name}' from type '${typeof value.name}'.`, loggingProperties);
            const name = new PersonName.Builder().fromValue(value.name, loggingProperties.nextIndent);

            // Return person properties
            return new PersonPropertiesWithIsAdmin(id, signInDate, value.isAdmin, name);
        }

        public fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties: LoggingProperties): PersonPropertiesWithIsAdmin {
            loggingProperties.append("PersonProperties.Builder.fromParameterContainer", {container: container, parameterName: parameterName});
            return this.fromValue(container.getParameter(parameterName, "object", loggingProperties.nextIndent), loggingProperties.nextIndent);
        }
    }
}
