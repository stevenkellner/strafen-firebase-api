import { createCipheriv, createDecipheriv } from 'crypto';
import { RandomBitIterator } from './RandomBitIterator';
import { UTF8WithLength16, UTF8WithLength32 } from './UTF8WithLength';
import { BufferToBitIterator } from './BufferToBitIterator';
import { CombineIterator } from './CombineIterator';
import { bitIteratorToBuffer, randomKey, xor } from './utils';

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
}
