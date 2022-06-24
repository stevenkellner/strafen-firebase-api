import { expect } from 'chai';
import { PseudoRandom } from '../src/crypter/PseudoRandom';
import { BufferToBitIterator } from '../src/crypter/BufferToBitIterator';
import { bits, xor, bitIteratorToBuffer } from '../src/crypter/utils';
import { RandomBitIterator } from '../src/crypter/RandomBitIterator';
import { CombineIterator } from '../src/crypter/CombineIterator';
import { Crypter } from '../src/crypter/Crypter';
import { UTF8WithLength32, UTF8WithLength16 } from '../src/crypter/UTF8WithLength';
import * as crypterTestData from './crypterTestData.json';

describe('Crypter', () => {

    describe('PseudoRandom', () => {
        it('random byte', () => {
            const pseudoRandom = new PseudoRandom('ouiz7uio');
            const expectedBytes = [132, 150, 115, 245, 137, 154, 232, 252, 253, 0, 236, 255, 34, 253, 223, 162, 62,
                26, 224, 212, 37, 138, 180, 152, 98, 195, 155, 239, 170, 150, 28, 81];
            for (const expectedByte of expectedBytes) {
                expect(pseudoRandom.randomByte()).to.be.equal(expectedByte);
            }
        });
    });

    describe('utils', () => {
        it('bits', () => {
            const dataset: [number, (0 | 1)[]][] = [
                [0x00, [0, 0, 0, 0, 0, 0, 0, 0]],
                [0x01, [0, 0, 0, 0, 0, 0, 0, 1]],
                [0x4e, [0, 1, 0, 0, 1, 1, 1, 0]],
                [0xff, [1, 1, 1, 1, 1, 1, 1, 1]],
            ];
            for (const data of dataset) {
                expect(bits(data[0])).to.be.deep.equal(data[1]);
            }
        });

        it('xor', () => {
            expect(xor(0, 0)).to.be.equal(0);
            expect(xor(1, 1)).to.be.equal(0);
            expect(xor(0, 1)).to.be.equal(1);
            expect(xor(1, 0)).to.be.equal(1);
        });

        it('bitIteratorToBuffer 1', () => {
            const bitIterator: Iterator<0 | 1> = ([] as (0 | 1)[])[Symbol.iterator]();
            const buffer = bitIteratorToBuffer(bitIterator);
            const expectedBuffer = Buffer.from([]);
            expect(buffer).to.be.deep.equal(expectedBuffer);
        });

        it('bitIteratorToBuffer 2', () => {
            const bitIterator: Iterator<0 | 1> = ([0, 0, 1, 0, 0, 0, 1, 1] as (0 | 1)[])[Symbol.iterator]();
            const buffer = bitIteratorToBuffer(bitIterator);
            const expectedBuffer = Buffer.from([0x23]);
            expect(buffer).to.be.deep.equal(expectedBuffer);
        });

        it('bitIteratorToBuffer 3', () => {
            const bitIterator: Iterator<0 | 1> = ([
                0, 0, 1, 0, 0, 0, 1, 1,
                0, 1, 0, 0, 0, 1, 0, 1,
                0, 1, 1, 0, 0, 1, 1, 1,
                1, 0, 1, 0, 1, 1, 1, 1,
            ] as (0 | 1)[])[Symbol.iterator]();
            const buffer = bitIteratorToBuffer(bitIterator);
            const expectedBuffer = Buffer.from([0x23, 0x45, 0x67, 0xaf]);
            expect(buffer).to.be.deep.equal(expectedBuffer);
        });
    });

    describe('BufferToBitIterator', () => {
        it('buffer to bits 1', () => {
            const buffer = Buffer.from([]);
            const bufferToBitIterator = new BufferToBitIterator(buffer);
            const expectedBits: (0 | 1)[] = [];
            let bitResult = bufferToBitIterator.next();
            let index = 0;
            while (!(bitResult.done ?? false)) {
                expect(bitResult.value).to.be.equal(expectedBits[index]);
                bitResult = bufferToBitIterator.next();
                index += 1;
            }
        });

        it('buffer to bits 2', () => {
            const buffer = Buffer.from([0x23]);
            const bufferToBitIterator = new BufferToBitIterator(buffer);
            const expectedBits: (0 | 1)[] = [0, 0, 1, 0, 0, 0, 1, 1];
            let bitResult = bufferToBitIterator.next();
            let index = 0;
            while (!(bitResult.done ?? false)) {
                expect(bitResult.value).to.be.equal(expectedBits[index]);
                bitResult = bufferToBitIterator.next();
                index += 1;
            }
        });

        it('buffer to bits 3', () => {
            const buffer = Buffer.from([0x23, 0x45, 0x67, 0xaf]);
            const bufferToBitIterator = new BufferToBitIterator(buffer);
            const expectedBits: (0 | 1)[] = [
                0, 0, 1, 0, 0, 0, 1, 1,
                0, 1, 0, 0, 0, 1, 0, 1,
                0, 1, 1, 0, 0, 1, 1, 1,
                1, 0, 1, 0, 1, 1, 1, 1,
            ];
            let bitResult = bufferToBitIterator.next();
            let index = 0;
            while (!(bitResult.done ?? false)) {
                expect(bitResult.value).to.be.equal(expectedBits[index]);
                bitResult = bufferToBitIterator.next();
                index += 1;
            }
        });
    });

    describe('RandomBitIterator', () => {
        it('random bits', () => {
            const randomBitIterator = new RandomBitIterator('9087zhk32k4leq');
            const expectedBits = [
                1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1,
                1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0,
                1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1,
            ];
            for (const expectedBit of expectedBits) {
                expect(randomBitIterator.next().value).to.be.equal(expectedBit);
            }
        });
    });

    describe('CombineIterator', () => {
        it('combine 1', () => {
            const iterator1 = [1, 2, 3][Symbol.iterator]();
            const iterator2 = [4, 5, 6][Symbol.iterator]();
            const combineIterator = new CombineIterator(iterator1, iterator2, (e1, e2) => [e1, e2] as [number, number]);
            const expectedData: [number, number][] = [[1, 4], [2, 5], [3, 6]];
            for (const expected of expectedData) {
                expect(combineIterator.next().value).to.be.deep.equal(expected);
            }
        });

        it('combine 1', () => {
            const iterator1 = [1, 2][Symbol.iterator]();
            const iterator2 = [4, 5, 6][Symbol.iterator]();
            const combineIterator = new CombineIterator(iterator1, iterator2, (e1, e2) => [e1, e2] as [number, number]);
            const expectedData: [number, number][] = [[1, 4], [2, 5]];
            for (const expected of expectedData) {
                expect(combineIterator.next().value).to.be.deep.equal(expected);
            }
        });

        it('combine 1', () => {
            const iterator1 = [1, 2, 3][Symbol.iterator]();
            const iterator2 = [4, 5][Symbol.iterator]();
            const combineIterator = new CombineIterator(iterator1, iterator2, (e1, e2) => [e1, e2] as [number, number]);
            const expectedData: [number, number][] = [[1, 4], [2, 5]];
            for (const expected of expectedData) {
                expect(combineIterator.next().value).to.be.deep.equal(expected);
            }
        });
    });

    describe('Crypter', () => {

        const cryptionKeys: Crypter.Keys = {
            encryptionKey: new UTF8WithLength32('GWf]2K;*R{AL8Puc~:X@SM-Nt.?TBv,a'),
            initialisationVector: new UTF8WithLength16('hwG5zFWc`6Rd)/&8'),
            vernamKey: new UTF8WithLength32('q\'9~jp8*v]4u-2f#s"VdKy;HQmD$+nxL'),
        };
        const crypter = new Crypter(cryptionKeys);

        it('aes 1', () => {
            const aesOriginalBytes = Buffer.from(crypterTestData.aesOriginal, 'base64');
            const aesEncryptedBytes = crypter.encryptAes(aesOriginalBytes);
            const aesDecryptedBytes = crypter.decryptAes(aesEncryptedBytes);
            expect(aesDecryptedBytes.equals(aesOriginalBytes)).to.be.true;
        });

        it('aes 2', () => {
            const aesEncryptedBytes = Buffer.from(crypterTestData.aesEncrypted, 'base64');
            const aesOriginalBytes = Buffer.from(crypterTestData.aesOriginal, 'base64');
            const aesDecryptedBytes = crypter.decryptAes(aesEncryptedBytes);
            expect(aesDecryptedBytes.equals(aesOriginalBytes)).to.be.true;
        });

        it('vernam 1', () => {
            const vernamOriginalBytes = Buffer.from(crypterTestData.vernamOriginal, 'base64');
            const vernamEncryptedBytes = crypter.encryptVernamCipher(vernamOriginalBytes);
            const vernamDecryptedBytes = crypter.decryptVernamCipher(vernamEncryptedBytes);
            expect(vernamDecryptedBytes.equals(vernamOriginalBytes)).to.be.true;
        });

        it('vernam 2', () => {
            const vernamEncryptedBytes = Buffer.from(crypterTestData.vernamEncrypted, 'base64');
            const vernamOriginalBytes = Buffer.from(crypterTestData.vernamOriginal, 'base64');
            const vernamDecryptedBytes = crypter.decryptVernamCipher(vernamEncryptedBytes);
            expect(vernamDecryptedBytes.equals(vernamOriginalBytes)).to.be.true;
        });

        it('vernam and aes 1', () => {
            const aesVernamOriginalBytes = Buffer.from(crypterTestData.aesVernamOriginal, 'base64');
            const aesVernamEncryptedBytes = crypter.encryptVernamAndAes(aesVernamOriginalBytes);
            const aesVernamDecryptedBytes = crypter.decryptAesAndVernam(aesVernamEncryptedBytes);
            expect(aesVernamDecryptedBytes.equals(aesVernamOriginalBytes)).to.be.true;
        });

        it('vernam and aes 2', () => {
            const aesVernamEncryptedBytes = Buffer.from(crypterTestData.aesVernamEncrypted, 'base64');
            const aesVernamOriginalBytes = Buffer.from(crypterTestData.aesVernamOriginal, 'base64');
            const aesVernamDecryptedBytes = crypter.decryptAesAndVernam(aesVernamEncryptedBytes);
            expect(aesVernamDecryptedBytes.equals(aesVernamOriginalBytes)).to.be.true;
        });
    });
});
