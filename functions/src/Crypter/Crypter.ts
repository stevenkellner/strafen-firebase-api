/* eslint-disable require-jsdoc */
import { Byte, bytesToUint8Array, bufferToBytes, Bit, uint16ToBytes, uint32ToBytes } from './BitAndByte';
import { UTF8WithLength16, UTF8WithLength32 } from './UTF8WithLength';
import crypto from 'crypto';
import { RandomBitIterator } from './RandomBitIterator';
import { BytesToBitIterator } from './BytesToBitIterator';
import { CombineIterator } from './CombineIterator';

/**
 * Used to en- and decrypt vernam and aes.
 */
export class Crypter {

    /**
     * Initializes Crypter with cryption keys.
     * @param { Crypter.Keys } cryptionKeys Keys used for en- and decrytion.
     */
    public constructor(
        private readonly cryptionKeys: Crypter.Keys
    ) {}

    /**
     * Encrypts bytes with aes.
     * @param { Byte[] } bytes Bytes to encrypt
     * @return { Byte[] } Encrypted bytes
     */
    private encryptAes(bytes: Byte[]): Byte[] {
        try {
            const cipher = crypto.createCipheriv(
                'aes-256-cbc',
                this.cryptionKeys.encryptionKey.rawString,
                this.cryptionKeys.initialisationVector.rawString
            );
            const encrypted = cipher.update(bytesToUint8Array(bytes));
            return bufferToBytes(Buffer.concat([encrypted, cipher.final()]));
        } catch {
            throw new Crypter.CrytptionError(Crypter.CrytptionError.Code.encryptAesError);
        }
    }

    /**
     * Decrypts bytes with aes.
     * @param { Byte[] } bytes Bytes to decrypt
     * @return { Byte[] } Decrypted bytes
     */
    private decryptAes(bytes: Byte[]): Byte[] {
        try {
            const decipher = crypto.createDecipheriv(
                'aes-256-cbc',
                this.cryptionKeys.encryptionKey.rawString,
                this.cryptionKeys.initialisationVector.rawString
            );
            const decrypted = decipher.update(bytesToUint8Array(bytes));
            return bufferToBytes(Buffer.concat([decrypted, decipher.final()]));
        } catch {
            throw new Crypter.CrytptionError(Crypter.CrytptionError.Code.decryptAesError);
        }
    }

    /**
     * Generates an utf-8 key with specified length
     * @param { number } length Length of key to generate
     * @return { string } Generated key
     */
    private randomKey(length: number): string {
        let string = '';
        for (let index = 0; index < length; index++) {
            const charCode = Math.floor(33 + Math.random() * 94);
            string += String.fromCharCode(charCode);
        }
        return string;
    }

    /**
     * Converts an iterator of bits to an array of bytes.
     * @param { Iterator<Bit> } iterator If itterator has number of bit not dividable to 8, the last bits are droped.
     * @return { Byte[] } Array of bytes
     */
    private bitIteratorToBytes(iterator: Iterator<Bit>): Byte[] {
        const bytes: Byte[] = [];
        let currentByte = new Byte();
        let index = 0;
        let bitResult = iterator.next();
        while (!(bitResult.done ?? false)) {
            currentByte.setBit(index, bitResult.value);
            index += 1;
            if (index == 8) {
                bytes.push(currentByte);
                currentByte = new Byte();
                index = 0;
            }
            bitResult = iterator.next();
        }
        return bytes;
    }

    private utf8ToBytes(string: string): Byte[] {
        const byteList: Byte[] = [];
        for (let index = 0; index < string.length; index++) {
            byteList.push(uint16ToBytes(string.charCodeAt(index))[1]);
        }
        return byteList;
    }

    private bytesToUtf8(bytes: Byte[]): string {
        return bytes.reduce((string, byte) => {
            return string + String.fromCharCode(byte.numberValue);
        }, '');
    }

    /**
     * Encrypts bytes with vernam.
     * @param { Byte[] } bytes Bytes to encrypt
     * @return { Byte[] } Encrypted bytes and key for vernam
     */
    private encryptVernamCipher(bytes: Byte[]): Byte[] {
        const key = this.randomKey(32);
        const randomBitIterator = new RandomBitIterator(key + this.cryptionKeys.vernamKey.rawString);
        const bytesToBitsIterator = new BytesToBitIterator(bytes);
        const combineIterator = new CombineIterator(randomBitIterator, bytesToBitsIterator, (bit1, bit2) => {
            return Bit.xor(bit1, bit2);
        });
        return this.utf8ToBytes(key).concat(this.bitIteratorToBytes(combineIterator));
    }

    /**
     * Decryptes bytes with vernam
     * @param { Byte[] } bytes First 32 bytes is key for vernam, other bytes is text to decrypt
     * @return { Byte[] } Decrypted bytes
     */
    private decryptVernamCipher(bytes: Byte[]): Byte[] {
        const key = this.bytesToUtf8(bytes.splice(0, 32));
        const randomBitIterator = new RandomBitIterator(key + this.cryptionKeys.vernamKey.rawString);
        const stringToBitIterator = new BytesToBitIterator(bytes);
        const combineIterator = new CombineIterator(randomBitIterator, stringToBitIterator, (bit1, bit2) => {
            return Bit.xor(bit1, bit2);
        });
        return this.bitIteratorToBytes(combineIterator);
    }

    /**
     * Encrypts bytes with vernam and then with aes.
     * @param { Byte[] } bytes Bytes to encrypt
     * @return { Byte[] } Encrypted bytes
     */
    public encryptVernamAndAes(bytes: Byte[]): Byte[] {
        const encryptedbytes = this.encryptVernamCipher(bytes);
        return this.encryptAes(encryptedbytes);
    }

    /**
     * Decrypts bytes with aes and then with vernam.
     * @param { Byte[] } encrypted Bytes to decrypt
     * @return { Byte[] } Decrypted bytes
     */
    public decryptAesAndVernam(encrypted: Byte[]): Byte[] {
        const bytes = this.decryptAes(encrypted);
        return this.decryptVernamCipher(bytes);
    }

    /**
     * Converts string to array of bytes. One char converts to 4 bytes.
     * @param { string } string String to convert to bytes
     * @return { Byte[] } String as array of bytes
     */
    public static stringToBytes(string: string): Byte[] {
        const byteList: Byte[] = [];
        for (let index = 0; index < string.length; index++) {
            const charCode = string.codePointAt(index);
            if (charCode == undefined) continue;
            for (const byte of uint32ToBytes(charCode)) {
                byteList.push(byte);
            }
        }
        return byteList;
    }

    /**
     * Converts array of bytes to string. 4 bytes converts to one char.
     * @param { Byte[] } bytes Bytes to convert to string
     * @return { string } Array of bytes as string
     */
    public static bytesToString(bytes: Byte[]): string {
        let currentInt = 0;
        return bytes.reduce((string, byte, index) => {
            currentInt += byte.numberValue << (8 * (3 - index % 4));
            if (index % 4 == 3) {
                const tmp = currentInt;
                currentInt = 0;
                return string + String.fromCodePoint(tmp);
            }
            return string;
        }, '');
    }
}

export namespace Crypter {

    /**
     * Keys used for en- and decrytion.
     */
    export interface Keys {

        /**
         * Encryption key for aes
         */
        encryptionKey: UTF8WithLength32,

        /**
         * Initialisation vector for aes
         */
        initialisationVector: UTF8WithLength16,

        /**
         * Key for vernam
         */
        vernamKey: UTF8WithLength32,
    }

    // / Errors thrown in en- and decrytion
    export class CrytptionError implements Error {

        public name = 'CrytptionError';

        public constructor(
            public readonly code: CrytptionError.Code
        ) {}

        public get ['message'](): string {
            return `${this.name}: ${this.code}`;
        }
    }

    export namespace CrytptionError {

        /**
         * Codes of errors thrown in en- and decrytion
         */
        export enum Code {

            /**
             * Error thrown in encyption of aes
             */
            encryptAesError,

            /**
             * Error thrown in decyption of aes
             */
            decryptAesError
        }
    }
}
