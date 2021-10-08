import { guid } from "./guid";
import { httpsError, PrimitveDataSnapshot } from "../utils";
import { ParameterContainer } from "./ParameterContainer";
import { PersonName } from "./PersonName";
import { LoggingProperties } from "./LoggingProperties";

export class Person {

    public constructor(
        public readonly id: guid,
        public readonly name: PersonName
    ) {}

    get ["serverObjectWithoutId"](): Person.ServerObjectWithoutId {
        return {
            name: this.name.serverObject,
        };
    }

    get ["serverObject"](): Person.ServerObject {
        return {
            id: this.id.guidString,
            name: this.name.serverObject,
        };
    }
}

export namespace Person {

    export interface ServerObject {
        id: string;
        name: PersonName.ServerObject;
    }

    export interface ServerObjectWithoutId {
        name: PersonName.ServerObject;
    }

    export class Builder {

        public fromValue(value: any, loggingProperties?: LoggingProperties): Person {
            loggingProperties?.append("Person.Builder.fromValue", {value: value});

            // Check if value is from type object
            if (typeof value !== "object")
                throw httpsError("invalid-argument", `Couldn't parse person, expected type 'object', but bot ${value} from type '${typeof value}'`, loggingProperties);

            // Check if type of id is string
            if (typeof value.id !== "string")
                throw httpsError("invalid-argument", `Couldn't parse Person parameter 'id'. Expected type 'string', but got '${value.id}' from type '${typeof value.id}'.`, loggingProperties);
            const id = guid.fromString(value.id, loggingProperties?.nextIndent);

            // Check if type of name is object
            if (typeof value.name !== "object")
                throw httpsError("invalid-argument", `Couldn't parse Person parameter 'name'. Expected type 'object', but got '${value.name}' from type '${typeof value.name}'.`, loggingProperties);
            const name = new PersonName.Builder().fromValue(value.name, loggingProperties?.nextIndent);

            // Return person
            return new Person(id, name);
        }

        public fromSnapshot(snapshot: PrimitveDataSnapshot, loggingProperties?: LoggingProperties): Person {
            loggingProperties?.append("Person.Builder.fromSnapshot", {snapshot: snapshot});

            // Check if data exists in snapshot
            if (!snapshot.exists())
                throw httpsError("invalid-argument", "Couldn't parse Person since no data exists in snapshot.", loggingProperties);

            // Get id
            const idString = snapshot.key;
            if (idString == null)
                throw httpsError("invalid-argument", "Couldn't parse Person since snapshot has an invalid key.", loggingProperties);

            // Get data from snapshot
            const data = snapshot.val();
            if (typeof data !== "object")
                throw httpsError("invalid-argument", `Couldn't parse Person from snapshot since data isn't an object: ${data}`, loggingProperties);

            return this.fromValue({
                id: idString,
                ...data,
            }, loggingProperties?.nextIndent);
        }

        public fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties?: LoggingProperties): Person {
            loggingProperties?.append("Person.Builder.fromParameterContainer", {container: container, parameterName: parameterName});
            return this.fromValue(container.getParameter(parameterName, "object", loggingProperties?.nextIndent), loggingProperties?.nextIndent);
        }
    }
}
