import { createCipheriv, createDecipheriv, createHash } from 'crypto';
import { RandomBitIterator } from './RandomBitIterator';
import { UTF8WithLength16, UTF8WithLength32 } from './UTF8WithLength';
import { BufferToBitIterator } from './BufferToBitIterator';
import { CombineIterator } from './CombineIterator';
import { bitIteratorToBuffer, randomKey, xor } from './utils';
import { unishortBuffer, unishortString } from '../utils';

/**
 * Used to en- and decrypt vernam and aes.
 */
export class Crypter {

    /**
     * Initializes Crypter with cryption keys.
     * @param { Crypter.Keys } cryptionKeys Keys used for en- and decrytion.
     */
    public constructor(private readonly cryptionKeys: Crypter.Keys) {}

    /**
     * Encrypts bytes with aes.
     * @param { Buffer } bytes Bytes to encrypt
     * @return { Buffer } Encrypted bytes.
     */
    public encryptAes(bytes: Buffer): Buffer {
        const cipher = createCipheriv(
            'aes-256-cbc',
            this.cryptionKeys.encryptionKey.rawString,
            this.cryptionKeys.initialisationVector.rawString
        );
        return Buffer.concat([cipher.update(bytes), cipher.final()]);
    }

    /**
     * Decrypts bytes with aes.
     * @param { Buffer } bytes Bytes to decrypt.
     * @return { Buffer } Decrypted bytes.
     */
    public decryptAes(bytes: Buffer): Buffer {
        const cipher = createDecipheriv(
            'aes-256-cbc',
            this.cryptionKeys.encryptionKey.rawString,
            this.cryptionKeys.initialisationVector.rawString
        );
        return Buffer.concat([cipher.update(bytes), cipher.final()]);
    }

    /**
     * Encrypts bytes with vernam.
     * @param { Buffer } bytes Bytes to encrypt.
     * @return { Buffer } Encrypted bytes.
     */
    public encryptVernamCipher(bytes: Buffer): Buffer {
        const key = randomKey(32);
        const randomBitIterator = new RandomBitIterator(key + this.cryptionKeys.vernamKey.rawString);
        const bufferToBitIterator = new BufferToBitIterator(bytes);
        const combineIterator = new CombineIterator(randomBitIterator, bufferToBitIterator, xor);
        return Buffer.concat([Buffer.from(key, 'utf8'), bitIteratorToBuffer(combineIterator)]);
    }

    /**
     * Decrypts bytes with vernam.
     * @param { Buffer } bytes Bytes to decrypt.
     * @return { Buffer } Decrypted bytes.
     */
    public decryptVernamCipher(bytes: Buffer): Buffer {
        const randomBitIterator = new RandomBitIterator(bytes.slice(0, 32) + this.cryptionKeys.vernamKey.rawString);
        const bufferToBitIterator = new BufferToBitIterator(bytes.slice(32));
        const combineIterator = new CombineIterator(randomBitIterator, bufferToBitIterator, xor);
        return bitIteratorToBuffer(combineIterator);
    }

    /**
     * Encrypts bytes with vernam and aes.
     * @param { Buffer } bytes Bytes to encrypt.
     * @return { Buffer } Encrypted bytes.
     */
    public encryptVernamAndAes(bytes: Buffer): Buffer {
        const vernamEncrypted = this.encryptVernamCipher(bytes);
        return this.encryptAes(vernamEncrypted);
    }

    /**
     * Decrypts bytes with aes and vernam.
     * @param { Buffer } bytes Bytes to decrypt.
     * @return { Buffer } Decrypted bytes.
     */
    public decryptAesAndVernam(bytes: Buffer): Buffer {
        const aesDecrypted = this.decryptAes(bytes);
        return this.decryptVernamCipher(aesDecrypted);
    }

    /**
     * Decryptes and decodes data.
     * @param { string } data Data to decrypt and decode.
     * @return { any } Decrypted and decoded data.
     */
    public decryptDecode(data: string): any {
        if (data === undefined || data === null || data === '') return {};
        const dataBuffer = unishortBuffer(data);
        const decryptedData = this.decryptAesAndVernam(dataBuffer);
        return JSON.parse(decryptedData.toString('utf8'));
    }

    /**
     * Encodes and encryptes data.
     * @param { any } data Data to encode or encrypt.
     * @return { string } Encoded and encrypted data.
     */
    public encodeEncrypt(data: any): string {
        const encodedData = JSON.stringify(data);
        const dataBuffer = Buffer.from(encodedData, 'utf8');
        const encryptedData = this.encryptVernamAndAes(dataBuffer);
        return unishortString(encryptedData);
    }
}

export namespace Crypter {

    /**
     * Keys used for en- and decrytion.
     */
    export interface Keys {

        /**
         * Encryption key for aes.
         */
        encryptionKey: UTF8WithLength32

        /**
         * Initialisation vector for aes
         */
        initialisationVector: UTF8WithLength16

        /**
         * Key for vernam
         */
        vernamKey: UTF8WithLength32
    }

    /**
     * Hashes value with sha512.
     * @param { string } value Value to hash.
     * @return { string } Sha512 hashed value.
     */
    export function sha512(value: string): string {
        const hasher = createHash('sha512');
        hasher.update(value);
        return hasher.digest('base64');
    }
}
