import { ParameterContainer } from '../ParameterContainer';
import { Amount } from './Amount';
import { Importance } from './Importance';
import { guid } from './guid';
import { ReasonTemplate } from './ReasonTemplate';
import { httpsError, reference } from '../utils';
import { Logger } from '../Logger';

/**
 * Contains a reason of a fine, either with a template id or custom with reason message, amount and importance
 */
export class FineReason {

    /**
     * Constructs fine reason with a template id or custom.
     * @param { FineReason.Template | FineReason.Custom } value Template id or custom reason.
     */
    public constructor(public readonly value: FineReason.Template | FineReason.Custom) {}

    /**
     * Fine reason object that will be stored in the database.
     */
    get databaseObject(): FineReason.DatabaseObject {

        // If this is a fine reason with template id, return the template id
        if (this.value instanceof FineReason.Template)
            return {
                reasonTemplateId: this.value.reasonTemplateId.guidString,
            };

        // Return custom fine reason
        return {
            reasonMessage: this.value.reasonMessage,
            amount: this.value.amount.numberValue,
            importance: this.value.importance.value,
        };
    }

    /**
     * Gets this fine reason for statistic.
     * @param { guid } clubId Id of the club the fine reason is in.
     * @param { ParameterContainer } parameterContainer Parameter container to get club reference.
     * @param { Logger } logger Logger to log this method.
     * @return { Promise<FineReason.Statistic> } This fine reason for statistics.
     */
    async statistic(
        clubId: guid,
        parameterContainer: ParameterContainer,
        logger: Logger
    ): Promise<FineReason.Statistic> {
        return await FineReason.Statistic.fromFineReason(this, clubId, parameterContainer, logger);
    }
}

export namespace FineReason {

    /**
     * Fine reason with template id.
     */
    export class Template {

        /**
         * Constructs template fine reason with template id.
         * @param { guid } reasonTemplateId Id of reason template.
         */
        public constructor(public readonly reasonTemplateId: guid) {}
    }

    /**
     * Custom fine reason with reason message, amount and importance,
     */
    export class Custom {

        /**
         * Constructs custom fine reason with reason message, amount and importance.
         * @param { string } reasonMessage Reason message of the fine reason.
         * @param { Amount } amount Amount of the fine reason.
         * @param { Importance } importance Importance of the fine reason.
         */
        constructor(
            public readonly reasonMessage: string,
            public readonly amount: Amount,
            public readonly importance: Importance
        ) {}

        /**
         * Gets this fine reason for statistic.
         */
        get statistic(): Statistic {
            return new Statistic(null, this.reasonMessage, this.amount, this.importance);
        }
    }

    /**
     * Builds fine reason from specified value.
     * @param { object } value Value to build fine reason from.
     * @param { Logger } logger Logger to log this method.
     * @return { FineReason } Builded fine reason.
     */
    export function fromObject(value: object & any, logger: Logger): FineReason {
        logger.append('FineReason.fromObject', { value });

        // Check if object has reason template id.
        if (typeof value.reasonTemplateId === 'string') {
            const reasonTemplateId = guid.fromString(value.reasonTemplateId, logger.nextIndent);
            return new FineReason(new FineReason.Template(reasonTemplateId));
        }

        // Check if object has reason, amount and importance.
        if (
            typeof value.reasonMessage == 'string' &&
            typeof value.amount === 'number' &&
            typeof value.importance === 'string'
        ) {
            const amount = Amount.fromNumber(value.amount, logger.nextIndent);
            const importance = Importance.fromString(value.importance, logger.nextIndent);
            return new FineReason(new FineReason.Custom(value.reasonMessage, amount, importance));
        }

        // Throw an error as fine reason couldn't build.
        throw httpsError(
            'invalid-argument',
            // eslint-disable-next-line max-len
            `Couldn't parse fine reason, no fine reason message with reason template id and no custom fine reason given, got instead: ${JSON.stringify(value)}`,
            logger
        );
    }

    /**
     * Builds fine reason from specified value.
     * @param { any } value Value to build fine reason from.
     * @param { Logger } logger Logger to log this method.
     * @return { FineReason } Builded fine reason.
     */
    export function fromValue(value: any, logger: Logger): FineReason {
        logger.append('FineReason.fromValue', { value });

        // Check if value is from type object.
        if (typeof value !== 'object')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse FineReason, expected type 'object', but bot ${value} from type '${typeof value}'`,
                logger
            );

        // Return fine reason.
        return FineReason.fromObject(value, logger.nextIndent);
    }

    /**
     * Fine reason object that will be stored in the database.
     */
    export type DatabaseObject = {
        reasonTemplateId: string;
    } | {
        reasonMessage: string;
        amount: number;
        importance: string;
    };

    /**
     * Statistic of a fine reason.
     */
    export class Statistic {

        /**
         * Constructs fine reason statistic with id or reason message, amount and importance.
         * @param { guid | null } reasonTemplateId Id of reason template if fine reason is from template.
         * @param { string } reasonMessage Reason message of the fine reason.
         * @param { Amount } amount Amount of the fine reason.
         * @param { Importance } importance Importance of the fine reason.
         */
        constructor(
            private readonly reasonTemplateId: guid | null,
            private readonly reasonMessage: string,
            private readonly amount: Amount,
            private readonly importance: Importance
        ) {}

        /**
         * Gets statistic of specified fine reason.
         * @param { FineReason } fineReason Fine reason to get statistic from.
         * @param { guid } clubId Id of the club the fine reason is in.
         * @param { ParameterContainer } parameterContainer Parameter container to get club reference.
         * @param { Logger } logger Logger to log this method.
         * @return { Promise<FineReason.Statistic> } This fine reason for statistics.
         */
        public static async fromFineReason(
            fineReason: FineReason,
            clubId: guid,
            parameterContainer: ParameterContainer,
            logger: Logger
        ): Promise<FineReason.Statistic> {
            logger.append('FineReason.Statistic.fromFineReason', { fineReason, clubId, parameterContainer });

            // Return statistic if fine reason is custom.
            if (fineReason.value instanceof FineReason.Custom)
                return fineReason.value.statistic;

            // Get fine reason properties from database.
            const reasonTemplateReference = reference(
                `${clubId.guidString}/reasonTemplates/${fineReason.value.reasonTemplateId.guidString}`,
                parameterContainer,
                logger.nextIndent,
            );
            const reasonTemplateSnapshot = await reasonTemplateReference.once('value');
            const reasonTemplate = ReasonTemplate.fromSnapshot(reasonTemplateSnapshot, logger.nextIndent);

            // Check if reason template is vaild.
            if (!(reasonTemplate instanceof ReasonTemplate))
                throw httpsError('internal', 'Couldn\'t get reasonTemplate for fine statistic.', logger);

            // Return fine reason statistic.
            return new FineReason.Statistic(
                reasonTemplate.id,
                reasonTemplate.reasonMessage,
                reasonTemplate.amount,
                reasonTemplate.importance
            );
        }

        /**
         * Fine reason statistic object that will be stored in the database.
         */
        get databaseObject(): Statistic.DatabaseObject {
            return {
                id: this.reasonTemplateId?.guidString ?? null,
                reasonMessage: this.reasonMessage,
                amount: this.amount.numberValue,
                importance: this.importance.value,
            };
        }
    }

    export namespace Statistic {

        /**
         * Fine reason statistic object that will be stored in the database.
         */
        export interface DatabaseObject {

            /**
             * Id of reason template if fine reason is from template.
             */
            id: string | null;

            /**
             * Reason message of the fine reason.
             */
            reasonMessage: string;

            /**
             * Amount of the fine reason.
             */
            amount: number;

            /**
             * Importance of the fine reason.
             */
            importance: string;
        }
    }
}
