import { httpsError } from "../utils";
import { guid } from "./guid";
import { LoggingProperties } from "./LoggingProperties";
import { ParameterContainer } from "./ParameterContainer";
import { PersonName } from "./PersonName";

export class PersonPropertiesWithUserId {
    public constructor(
        public readonly id: guid,
        public readonly signInDate: Date,
        public readonly userId: string,
        public readonly name: PersonName
    ) {}

    public get ["serverObject"](): PersonPropertiesWithUserId.ServerObject {
        return {
            id: this.id.guidString,
            signInDate: this.signInDate.toISOString(),
            userId: this.userId,
            name: this.name.serverObject,
        };
    }
}

export namespace PersonPropertiesWithUserId {

    export interface ServerObject {
        id: string,
        signInDate: string,
        userId: string,
        name: PersonName.ServerObject
    }

    export class Builder {

        public fromValue(value: any, loggingProperties: LoggingProperties): PersonPropertiesWithUserId {
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

            // Check if type of userId is string
            if (typeof value.userId !== "string")
                throw httpsError("invalid-argument", `Couldn't parse person properties parameter 'userId'. Expected type 'string', but got '${value.id}' from type '${typeof value.id}'.`, loggingProperties);

            // Check if type of name is object
            if (typeof value.name !== "object")
                throw httpsError("invalid-argument", `Couldn't parse person properties parameter 'name'. Expected type 'object', but got '${value.id}' from type '${typeof value.id}'.`, loggingProperties);
            const name = new PersonName.Builder().fromValue(value.name, loggingProperties.nextIndent);

            // Return person properties
            return new PersonPropertiesWithUserId(id, signInDate, value.userId, name);
        }

        public fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties: LoggingProperties): PersonPropertiesWithUserId {
            loggingProperties.append("PersonProperties.Builder.fromParameterContainer", {container: container, parameterName: parameterName});
            return this.fromValue(container.getParameter(parameterName, "object", loggingProperties.nextIndent), loggingProperties.nextIndent);
        }
    }
}
