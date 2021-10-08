import { httpsError } from "../utils";
import { guid } from "./guid";
import { LoggingProperties } from "./LoggingProperties";

export interface UpdatePropertiesObject {
    timestamp: number;
    personId: string;
}

export class UpdateProperties {
    readonly timestamp: number;
    readonly personId: guid;

    constructor(timestamp: number, personId: guid) {
        this.timestamp = timestamp;
        this.personId = personId;
    }

    static fromValue(value: any, loggingProperties?: LoggingProperties): UpdateProperties {
        loggingProperties?.append("UpdateProperties.fromValue", {value: value});

        // Check if value is from type object
        if (typeof value !== "object")
            throw httpsError("invalid-argument", `Couldn't parse update properties, expected type 'object', but bot ${value} from type '${typeof value}'`, loggingProperties);

        // Check if person id is string
        if (typeof value.personId !== "string")
            throw httpsError("invalid-argument", `Couldn't parse UpdateProperties parameter 'personId', expected type string but got '${value.personId}' from type ${typeof value.personId}`, loggingProperties);
        const personId = guid.fromString(value.personId, loggingProperties?.nextIndent);

        // Check if timestamp is a positive number
        if (typeof value.timestamp !== "number" || value.timestamp < 0)
            throw httpsError("invalid-argument", `Couldn't parse UpdateProperties parameter 'timestamp', expected positive number but got '${value.timestamp}' from type ${typeof value.timestamp}`, loggingProperties);

        return new UpdateProperties(value.timestamp, personId);
    }

    get ["serverObject"](): UpdatePropertiesObject {
        return {
            timestamp: this.timestamp,
            personId: this.personId.guidString,
        };
    }
}

interface UpdatableType<ServerObject> {
    serverObject: ServerObject;
}

type ServerObjectOf<Updatable> = Updatable extends UpdatableType<infer ServerObject> ? ServerObject : never;

export class UpdatableWithServerObject<T extends UpdatableType<ServerObjectOf<T>>> {

    constructor(
        public property: T,
        public updateProperties: UpdateProperties,
    ) {}

    get ["serverObject"](): Updatable<ServerObjectOf<T>> {
        return {
            ...this.property.serverObject,
            updateProperties: this.updateProperties,
        };
    }
}

export type Updatable<T> = T & {
    updateProperties: UpdateProperties,
}

interface BuilderOf<T> {
    fromValue(value: any): T
}

export function getUpdatable<T extends UpdatableType<ServerObjectOf<T>>, Builder extends BuilderOf<T>>(value: any, builder: Builder, loggingProperties?: LoggingProperties): UpdatableWithServerObject<T> {
    loggingProperties?.append("getUpdatable", {value: value, builder: builder});
    const property = builder.fromValue(value);
    const updateProperties = UpdateProperties.fromValue(value, loggingProperties);
    return new UpdatableWithServerObject(property, updateProperties);
}
