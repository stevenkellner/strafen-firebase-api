import { StringBuilder } from './StringBuilder';

/**
 * Level of a log message.
 */
class LogLevel {

    /**
     * Constructs log level with raw value.
     * @param { 'debug' | 'info' | 'notice' } value Raw value of the log level.
     */
    constructor(private readonly value: 'debug' | 'info' | 'notice') {}

    /**
     * Colors specifed text depending on this log level.
     * @param { string } text Text to color
     * @return { string } Colored text.
     */
    coloredText(text: string): string {
        switch (this.value) {
        case 'debug': return text.yellow();
        case 'info': return text.red();
        case 'notice': return text.blue();
        }
    }
}

/**
 * Contains all properties of a log message
 */
interface LoggingProperty {

    /**
     * Name of the function the log happend.
     */
    readonly functionName: string;

    /**
     * Level of the log message.
     */
    readonly level: LogLevel;

    /**
     * Indent of the log message.
     */
    readonly indent: number;

    /**
     * Details of the log message.
     */
    readonly details: { [key: string]: any };
}

/**
 * Logger to log multiple log messages.
 */
export class Logger {

    /**
     * Constructs logger with log messages properties.
     * @param { boolean } verbose Indicates whether the logger is verbose.
     * @param { LoggingProperty[] } properties Properties of log messages.
     * @param { number } currentIndent Current indent number.
     */
    private constructor(
        private readonly verbose: boolean,
        private readonly properties: LoggingProperty[],
        private currentIndent: number = 0
    ) {}

    /**
     * Begins the logger with a log message.
     * @param { boolean } verbose Indicates whether logger is verbose.
     * @param { string } functionName Name of the function the log happend.
     * @param { { string: any }  } details Details of the log message.
     * @param { 'debug' | 'info' | 'notice' } level Level of the log message.
     * @return { Logger } New logger with log message.
     */
    public static start(
        verbose: boolean,
        functionName: string,
        details: { [key: string]: any } = {},
        level: 'debug' | 'info' | 'notice' = 'debug'
    ): Logger {
        const property: LoggingProperty = {
            functionName: functionName,
            level: new LogLevel(level),
            indent: 0,
            details: details,
        };
        return new Logger(verbose, [property]);
    }

    /**
     * Returns a logger with an increased indent.
     */
    public get nextIndent(): Logger {
        return new Logger(this.verbose, this.properties, this.currentIndent + 1);
    }

    /**
     * Appends a new log message.
     * @param { string } functionName Name of the function the log happend.
     * @param { { string: any }  } details Details of the log message.
     * @param { 'debug' | 'info' | 'notice' } level Level of the log message.
     */
    public append(
        functionName: string,
        details: { [key: string]: any } = {},
        level: 'debug' | 'info' | 'notice' = 'debug'
    ) {
        this.properties.push({
            functionName: functionName,
            level: new LogLevel(level),
            indent: this.currentIndent,
            details: details,
        });
    }

    /**
     * Description of specified property.
     * @param { LoggingProperty } property Property to get the description.
     * @return { string } Description of specified property.
     */
    private propertyString(property: LoggingProperty): string {
        const builder = new StringBuilder();
        builder.appendLine(
            `${' '.repeat(2 * property.indent)}| ${property.level.coloredText(`[${property.functionName}]`)}`
        );
        if (this.verbose) {
            for (const key in property.details) {
                if (Object.prototype.hasOwnProperty.call(property.details, key))
                    builder.append(this.detailString(property.indent, key, property.details[key]));
            }
        }
        return builder.toString();
    }

    /**
     * Description of a log message.
     * @param { number } indent Indent of the log message.
     * @param { string } key Key of the log message.
     * @param { { string: any }  } detail Detail of the log message.
     * @return { string }Description of a log message.
     */
    private detailString(indent: number, key: string, detail: { [key: string]: any }): string {
        const builder = new StringBuilder();
        const jsonLines = JSON.stringify(detail, null, '  ')?.split('\n') ?? [''];
        builder.appendLine(`${' '.repeat(2 * indent)}| ${`${key}: ${jsonLines.shift()?.gray()}`}`);
        for (const line of jsonLines)
            builder.appendLine(`${' '.repeat(2 * indent)}| ${' '.repeat(key.length + 2)}${line.gray()}`);
        return builder.toString();
    }

    /**
     * Description of this logger.
     */
    public get joinedMessages(): string {
        const builder = new StringBuilder();
        for (const property of this.properties) {
            builder.append(this.propertyString(property));
        }
        return builder.toString();
    }
}
