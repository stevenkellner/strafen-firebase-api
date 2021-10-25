import { httpsError } from "../utils";
import { guid } from "./guid";
import { LoggingProperties } from "./LoggingProperties";
import { ParameterContainer } from "./ParameterContainer";

export class ClubProperties {
    public constructor(
        public readonly id: guid,
        public readonly name: string,
        public readonly identifier: string,
        public readonly regionCode: string,
        public readonly inAppPaymentActive: boolean
    ) {}

    public get ["serverObject"](): ClubProperties.ServerObject {
        return {
            id: this.id.guidString,
            name: this.name,
            identifier: this.identifier,
            regionCode: this.regionCode,
            inAppPaymentActive: this.inAppPaymentActive,
        };
    }
}

export namespace ClubProperties {

    export interface ServerObject {
        id: string,
        name: string,
        identifier: string,
        regionCode: string,
        inAppPaymentActive: boolean,
    }

    export class Builder {

        public fromValue(value: any, loggingProperties: LoggingProperties): ClubProperties {
            loggingProperties.append("ClubProperties.Builder.fromValue", {value: value});

            // Check if value is from type object
            if (typeof value !== "object")
                throw httpsError("invalid-argument", `Couldn't parse club properties, expected type 'object', but bot ${value} from type '${typeof value}'`, loggingProperties);

            // Check if type of id is string
            if (typeof value.id !== "string")
                throw httpsError("invalid-argument", `Couldn't parse club properties parameter 'id'. Expected type 'string', but got '${value.id}' from type '${typeof value.id}'.`, loggingProperties);
            const id = guid.fromString(value.id, loggingProperties.nextIndent);

            // Check if type of name is string
            if (typeof value.name !== "string")
                throw httpsError("invalid-argument", `Couldn't parse club properties parameter 'name'. Expected type 'string', but got '${value.name}' from type '${typeof value.name}'.`, loggingProperties);

            // Check if type of identifier is string
            if (typeof value.identifier !== "string")
                throw httpsError("invalid-argument", `Couldn't parse club properties parameter 'identifier'. Expected type 'string', but got '${value.identifier}' from type '${typeof value.identifier}'.`, loggingProperties);

            // Check if type of regionCode is string
            if (typeof value.regionCode !== "string")
                throw httpsError("invalid-argument", `Couldn't parse club properties parameter 'regionCode'. Expected type 'string', but got '${value.regionCode}' from type '${typeof value.regionCode}'.`, loggingProperties);

            // Check if type of inAppPaymentActive is boolean
            if (typeof value.inAppPaymentActive !== "boolean")
                throw httpsError("invalid-argument", `Couldn't parse club properties parameter 'inAppPaymentActive'. Expected type 'boolean', but got '${value.inAppPaymentActive}' from type '${typeof value.inAppPaymentActive}'.`, loggingProperties);

            // Return club properties
            return new ClubProperties(id, value.name, value.identifier, value.regionCode, value.inAppPaymentActive);
        }

        public fromParameterContainer(container: ParameterContainer, parameterName: string, loggingProperties: LoggingProperties): ClubProperties {
            loggingProperties.append("ClubProperties.Builder.fromParameterContainer", {container: container, parameterName: parameterName});
            return this.fromValue(container.getParameter(parameterName, "object", loggingProperties.nextIndent), loggingProperties.nextIndent);
        }
    }
}
