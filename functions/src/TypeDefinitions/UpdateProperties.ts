import { httpsError } from "../utils";
import { guid } from "./guid";
import { LoggingProperties } from "./LoggingProperties";

export interface UpdatePropertiesObject {
    timestamp: string;
    personId: string;
}

export class UpdateProperties {
    readonly timestamp: Date;
    readonly personId: guid;

    constructor(timestamp: Date, personId: guid) {
        this.timestamp = timestamp;
        this.personId = personId;
    }

    static fromValue(value: any, loggingProperties: LoggingProperties): UpdateProperties {
        loggingProperties.append("UpdateProperties.fromValue", {value: value});

        // Check if value is from type object
        if (typeof value !== "object")
            throw httpsError("invalid-argument", `Couldn't parse update properties, expected type 'object', but bot ${value} from type '${typeof value}'`, loggingProperties);

        // Check if person id is string
        if (typeof value.personId !== "string")
            throw httpsError("invalid-argument", `Couldn't parse UpdateProperties parameter 'personId', expected type string but got '${value.personId}' from type ${typeof value.personId}`, loggingProperties);
        const personId = guid.fromString(value.personId, loggingProperties.nextIndent);

        // Check if timestamp is a iso string
        if (typeof value.timestamp !== "string" || isNaN(new Date(value.timestamp).getTime()))
            throw httpsError("invalid-argument", `Couldn't parse UpdateProperties parameter 'timestamp', expected iso string but got '${value.timestamp}' from type ${typeof value.timestamp}`, loggingProperties);

        return new UpdateProperties(new Date(value.timestamp), personId);
    }

    get ["serverObject"](): UpdatePropertiesObject {
        return {
            timestamp: this.timestamp.toISOString(),
            personId: this.personId.guidString,
        };
    }
}

interface UpdatableType<ServerObject> {
    serverObject: ServerObject;
}

type ServerObjectOf<Updatable> = Updatable extends UpdatableType<infer ServerObject> ? ServerObject : never;

export class Updatable<T extends UpdatableType<ServerObjectOf<T>>> {

    constructor(
        public property: T,
        public updateProperties: UpdateProperties,
    ) {}

    get ["serverObject"](): UpdatableServerObject<ServerObjectOf<T>> {
        return {
            ...this.property.serverObject,
            updateProperties: this.updateProperties.serverObject,
        };
    }
}

export type UpdatableServerObject<T> = T & {
    updateProperties: UpdatePropertiesObject,
}

interface BuilderOf<T> {
    fromValue(value: any, loggingProperties: LoggingProperties): T
}

export function getUpdatable<T extends UpdatableType<ServerObjectOf<T>>, Builder extends BuilderOf<T>>(value: any, builder: Builder, loggingProperties: LoggingProperties): Updatable<T> {
    loggingProperties.append("getUpdatable", {value: value, builder: builder});
    const property = builder.fromValue(value, loggingProperties);

    // Get update properties
    if (typeof value !== "object" || typeof value.updateProperties !== "object")
        throw httpsError("invalid-argument", "Couldn't get updateProperties.", loggingProperties);
    const updateProperties = UpdateProperties.fromValue(value.updateProperties, loggingProperties);

    return new Updatable(property, updateProperties);
}
