import { ParameterContainer } from "./ParameterContainer";
import { StringBuilder } from "./StringBuilder";

class LogLevel {
    constructor(private readonly value: "debug" | "info" | "notice") {}

    coloredText(text: string): string {
        switch (this.value) {
        case "debug":
            return text.yellow();
        case "info":
            return text.red();
        case "notice":
            return text.blue();
        }
    }
}

interface LoggingProperty {
    readonly functionName: string;
    readonly level: LogLevel;
    readonly indent: number;
    readonly details: { [key: string]: any };
}

export class LoggingProperties {

    private constructor(
        private readonly verbose: boolean,
        private readonly properties: LoggingProperty[],
        private currentIndent: number = 0
    ) {}

    public static withFirst(parameterContainer: ParameterContainer, functionName: string, details: { [key: string]: any } = {}, level: "debug" | "info" | "notice" = "debug"): LoggingProperties {
        const verbose = (parameterContainer.getOptionalParameter("verbose", "boolean", undefined) as boolean | null) ?? false;
        const property: LoggingProperty = {
            functionName: functionName,
            level: new LogLevel(level),
            indent: 0,
            details: details,
        };
        return new LoggingProperties(verbose, [property]);
    }

    public get ["nextIndent"](): LoggingProperties {
        return new LoggingProperties(this.verbose, this.properties, this.currentIndent + 1);
    }

    public append(functionName: string, details: { [key: string]: any } = {}, level: "debug" | "info" | "notice" = "debug") {
        this.properties.push({
            functionName: functionName,
            level: new LogLevel(level),
            indent: this.currentIndent,
            details: details,
        });
    }

    private propertyString(property: LoggingProperty): string {
        const builder = new StringBuilder();
        builder.appendLine(`${" ".repeat(2 * property.indent)}| ${property.level.coloredText(`[${property.functionName}]`)}`);
        if (this.verbose) {
            for (const key in property.details) {
                if (Object.prototype.hasOwnProperty.call(property.details, key))
                    builder.append(this.detailString(property.indent, key, property.details[key]));
            }
        }
        return builder.toString();
    }

    private detailString(indent: number, key: string, detail: { [key: string]: any }): string {
        const builder = new StringBuilder();
        const jsonLines = JSON.stringify(detail, null, "  ").split("\n");
        builder.appendLine(`${" ".repeat(2 * indent)}| ${`${key}: ${jsonLines.shift()!.gray()}`}`);
        for (const line of jsonLines)
            builder.appendLine(`${" ".repeat(2 * indent)}| ${" ".repeat(key.length + 2)}${line.gray()}`);
        return builder.toString();
    }

    public get ["joinedMessages"](): string {
        const builder = new StringBuilder();
        for (const property of this.properties) {
            builder.append(this.propertyString(property));
        }
        return builder.toString();
    }
}

declare global {
    interface String {
        red(): string;
        green(): string;
        yellow(): string;
        blue(): string;
        magenta(): string;
        cyan(): string;
        gray(): string;
    }
}

String.prototype.red = function() {
    return `\x1b[31m${this}\x1b[0m`;
};

String.prototype.green = function() {
    return `\x1b[32m${this}\x1b[0m`;
};

String.prototype.yellow = function() {
    return `\x1b[33m${this}\x1b[0m`;
};

String.prototype.blue = function() {
    return `\x1b[34m${this}\x1b[0m`;
};

String.prototype.magenta = function() {
    return `\x1b[35m${this}\x1b[0m`;
};

String.prototype.cyan = function() {
    return `\x1b[36m${this}\x1b[0m`;
};

String.prototype.gray = function() {
    return `\x1b[40m\x1b[2m${this}\x1b[0m`;
};
