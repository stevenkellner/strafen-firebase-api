import { guid } from './guid';
import { FineReason } from './FineReason';
import { Deleted, httpsError, reference } from '../utils';
import { Person } from './Person';
import { PayedState } from './PayedState';
import { Logger } from '../Logger';
import { DatabaseType } from './DatabaseType';
import { cryptionKeys } from '../privateKeys';
import { Crypter } from '../crypter/Crypter';

/**
 * Contains all properties of a fine.
 */
export class Fine {

    /**
     * Constructs the fine with id, personId, payed state, number, date and fine reason.
     * @param { guid } id Id of the fine.
     * @param { guid } personId Associated person id of the fine.
     * @param { PayedState } payedState Payed state of the fine.
     * @param { number } number Number of the fine.
     * @param { Date } date Date of the fine.
     * @param { FineReason } fineReason Fine reason of the fine.
     */
    public constructor(
        public readonly id: guid,
        public readonly personId: guid,
        public payedState: PayedState,
        public readonly number: number,
        public readonly date: Date,
        public readonly fineReason: FineReason
    ) {}

    /**
     * Fine object without id that will be stored in the database.
     */
    public get databaseObjectWithoutId(): Fine.DatabaseObjectWithoutId {
        return {
            personId: this.personId.guidString,
            payedState: this.payedState.databaseObject,
            number: this.number,
            date: this.date.toISOString(),
            fineReason: this.fineReason.databaseObject,
        };
    }

    /**
     * Fine object that will be stored in the database.
     */
    public get databaseObject(): Fine.DatabaseObject {
        return {
            id: this.id.guidString,
            ...this.databaseObjectWithoutId,
        };
    }

    /**
     * Gets this fine for statistics.
     * @param { guid } clubId Id of the club the fine is in.
     * @param { DatabaseType } databaseType Database type to get club reference.
     * @param { Logger } logger Logger to log this method.
     * @return { Promise<Fine.Statistic> } This fine for statistics.
     */
    public async statistic(
        clubId: guid,
        databaseType: DatabaseType,
        logger: Logger
    ): Promise<Fine.Statistic> {
        return await Fine.Statistic.fromFine(this, clubId, databaseType, logger);
    }
}

export namespace Fine {

    /**
     * Fine object without id that will be stored in the database.
     */
    export interface DatabaseObjectWithoutId {

        /**
         * Associated person id of the fine.
         */
        personId: string,

        /**
         * Payed state of the fine.
         */
        payedState: PayedState.DatabaseObject,

        /**
         * Number of the fine.
         */
        number: number,

        /**
         * Date of the fine.
         */
        date: string,

        /**
         * Fine reason of the fine.
         */
        fineReason: FineReason.DatabaseObject
    }

    /**
     * Fine object that will be stored in the database.
     */
    export type DatabaseObject = { id: string } & DatabaseObjectWithoutId;

    /**
     * Builds fine from specified value.
     * @param { object } value Value to build fine from.
     * @param { Logger } logger Logger to log this method.
     * @return { Fine | Deleted<guid> } Builded fine.
     */
    export function fromObject(value: object & any, logger: Logger): Fine | Deleted<guid> {
        logger.append('Fine.fromObject', { value });

        // Check if id is string.
        if (typeof value.id !== 'string')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse fine parameter 'id', expected type string but got '${value.id}' from type ${typeof value.id}`,
                logger
            );
        const id = guid.fromString(value.id, logger.nextIndent);

        // Check if fine is deleted.
        if (typeof value.deleted !== 'undefined') {
            if (typeof value.deleted !== 'boolean' || !value.deleted)
                throw httpsError(
                    'invalid-argument',
                    'Couldn\'t parse fine, deleted argument wasn\'t from type boolean or was false.',
                    logger
                );
            return new Deleted(id);
        }

        // Check if person id is string.
        if (typeof value.personId !== 'string')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse fine parameter 'personId', expected type string but got '${value.personId}' from type ${typeof value.personId}`,
                logger
            );
        const personId = guid.fromString(value.personId, logger.nextIndent);

        // Check if payed state is object.
        if (typeof value.payedState !== 'object')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse fine parameter 'payedState', expected type object but got '${value.payedState}' from type ${typeof value.payedState}`,
                logger
            );
        const payedState = PayedState.fromObject(value.payedState, logger.nextIndent);

        // Check if number is a positive number.
        if (typeof value.number !== 'number' || value.number <= 0 || value.number != Number.parseInt(value.number))
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse fine parameter 'number', expected unsigned integer greater zero but got '${value.number}' from type ${typeof value.number}`,
                logger
            );

        // Check if date is a iso string.
        if (typeof value.date !== 'string' || isNaN(new Date(value.date).getTime()))
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse fine parameter 'date', expected iso string but got '${value.date}' from type ${typeof value.date}`,
                logger
            );

        // Check if fine reason is object.
        if (typeof value.fineReason !== 'object')
            throw httpsError(
                'invalid-argument',
                // eslint-disable-next-line max-len
                `Couldn't parse fine parameter 'fineReason', expected type object but got '${value.fineReason}' from type ${typeof value.fineReason}`,
                logger
            );
        const fineReason = FineReason.fromObject(value.fineReason, logger.nextIndent);

        // Return fine.
        return new Fine(id, personId, payedState, value.number, new Date(value.date), fineReason);

    }

    /**
     * Builds fine from specified value.
     * @param { any } value Value to build fine from.
     * @param { Logger } logger Logger to log this method.
     * @return { Fine | Deleted<guid> } Builded fine.
     */
    export function fromValue(value: any, logger: Logger): Fine | Deleted<guid> {
        logger.append('Fine.fromValue', { value });

        // Check if value is from type object.
        if (typeof value !== 'object')
            throw httpsError(
                'invalid-argument',
                `Couldn't parse fine, expected type 'object', but bot ${value} from type '${typeof value}'`,
                logger
            );

        // Return fine.
        return Fine.fromObject(value, logger.nextIndent);
    }

    /**
     * Statistic of a fine.
     */
    export class Statistic {

        /**
         * Constructs the fine statistic with id, person, payed state, number, date and fine reason.
         * @param { guid } id Id of the fine.
         * @param { Person.Statistic } person Associated person statistic of the fine.
         * @param { PayedState.Statistic } payedState Payed state statistic of the fine.
         * @param { number } number Number of the fine.
         * @param { Date } date Date of the fine.
         * @param { FineReason.Statistic } fineReason Fine reason statistic of the fine.
         */
        private constructor(
            public readonly id: guid,
            public readonly person: Person.Statistic,
            public readonly payedState: PayedState,
            public readonly number: number,
            public readonly date: Date,
            public readonly fineReason: FineReason.Statistic
        ) {}

        /**
         * Gets statistics for specified fine.
         * @param { Fine } fine Fine to get statisic from.
         * @param { guid } clubId Id of the club the fine is in.
         * @param { DatabaseType } databaseType Database type to get club reference.
         * @param { Logger } logger Logger to log this method.
         * @return { Promise<Fine.Statistic> } Statistic of specified fine.
         */
        public static async fromFine(
            fine: Fine,
            clubId: guid,
            databaseType: DatabaseType,
            logger: Logger
        ): Promise<Statistic> {
            logger.append('Fine.Statistic.fromFine', { fine, clubId, databaseType });

            // Get statistic person.
            const crypter = new Crypter(cryptionKeys(databaseType));
            const personReference = reference(
                `${clubId.guidString}/persons/${fine.personId.guidString}`,
                databaseType,
                logger.nextIndent,
            );
            const personSnapshot = await personReference.once('value');
            const person = Person.fromObject({
                id: personSnapshot.key,
                ...crypter.decryptDecode(personSnapshot.val()),
            }, logger.nextIndent);
            if (!(person instanceof Person))
                throw httpsError('internal', 'Couldn\'t get person for fine statistic.', logger);

            // Get statistic fine reason.
            const fineReason = await fine.fineReason.statistic(clubId, databaseType, logger.nextIndent);

            // Return statistic.
            return new Statistic(
                fine.id,
                person.statistic,
                fine.payedState,
                fine.number,
                fine.date,
                fineReason
            );
        }

        /**
         * Fine statistic object that will be stored in the database.
         */
        public get databaseObject(): Statistic.DatabaseObject {
            return {
                id: this.id.guidString,
                person: this.person.databaseObject,
                payedState: this.payedState.databaseObject,
                number: this.number,
                date: this.date.toISOString(),
                fineReason: this.fineReason.databaseObject,
            };
        }
    }

    export namespace Statistic {


        /**
         * Fine statistic object that will be stored in the database.
         */
        export interface DatabaseObject {

            /**
             * Id of the fine.
             */
            id: string,

            /**
             * Associated person statistic of the fine.
             */
            person: Person.Statistic.DatabaseObject,

            /**
             * Payed state statistic of the fine.
             */
            payedState: PayedState.DatabaseObject,

            /**
             * Number of the fine.
             */
            number: number,

            /**
             * Date of the fine.
             */
            date: string,

            /**
             * Fine reason statistic of the fine.
             */
            fineReason: FineReason.Statistic.DatabaseObject
        }
    }
}
