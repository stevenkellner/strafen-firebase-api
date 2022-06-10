/* eslint-disable require-jsdoc */
/**
 * Represents a bit; zero or one.
 */
export enum Bit {

    /**
     * Zero bit value
     */
    zero,

    /**
     * One bit value
     */
    one
}

export namespace Bit {
    export function from01Number(number: number): Bit {
        return number == 0 ? Bit.zero : Bit.one;
    }

    export function toNumber(bit: Bit): number {
        switch (bit) {
        case Bit.zero: return 0;
        case Bit.one: return 1;
        }
    }

    export function xor(lhs: Bit, rhs: Bit): Bit {
        return lhs == rhs ? Bit.zero : Bit.one;
    }
}

/**
 * Represents a byte; 8 bit list
 */
export class Byte {

    public constructor(
        public readonly bitList: [Bit, Bit, Bit, Bit, Bit, Bit, Bit, Bit]
        = [Bit.zero, Bit.zero, Bit.zero, Bit.zero, Bit.zero, Bit.zero, Bit.zero, Bit.zero]
    ) {}

    static fromNumberByte(numberByte: number): Byte {
        const bitsArray = new Byte().bitList;
        for (let index = 0; index < 8; index++) {
            const bit = numberByte & 0x01;
            numberByte = (numberByte - bit) / 2;
            bitsArray[8 - index - 1] = Bit.from01Number(bit);
        }
        return new Byte(bitsArray);
    }

    public get numberValue(): number {
        let number = 0;
        for (let index = 0; index < 8; index++) {
            number += Bit.toNumber(this.bitList[index]) * (1 << (8 - index - 1));
        }
        return number;
    }

    public setBit(index: number, bit: Bit) {
        if (index < 0 ||index >= 8) return;
        this.bitList[index] = bit;
    }

    public toString(): string {
        return `${Bit.toNumber(this.bitList[0])}${Bit.toNumber(this.bitList[1])}${Bit.toNumber(this.bitList[2])}
        ${Bit.toNumber(this.bitList[3])} ${Bit.toNumber(this.bitList[4])}${Bit.toNumber(this.bitList[5])}
        ${Bit.toNumber(this.bitList[6])}${Bit.toNumber(this.bitList[7])}`;
    }
}

export function uint16ToBytes(uint32: number): [Byte, Byte] {
    const bytesArray: [Byte, Byte] = [new Byte(), new Byte()];
    for (let index = 0; index < 2; index++) {
        const byte = uint32 & 0xff;
        uint32 = (uint32 - byte) / 256;
        bytesArray[2 - index - 1] = Byte.fromNumberByte(byte);
    }
    return bytesArray;
}

export function uint32ToBytes(uint32: number): [Byte, Byte, Byte, Byte] {
    const bytesArray: [Byte, Byte, Byte, Byte] = [new Byte(), new Byte(), new Byte(), new Byte()];
    for (let index = 0; index < 4; index++) {
        const byte = uint32 & 0xff;
        uint32 = (uint32 - byte) / 256;
        bytesArray[4 - index - 1] = Byte.fromNumberByte(byte);
    }
    return bytesArray;
}

export function bytesToUint8Array(bytes: Byte[]): Uint8Array {
    return new Uint8Array(bytes.map(byte => {
        return byte.numberValue;
    }));
}

export function bufferToBytes(buffer: Buffer): Byte[] {
    const bytes: Byte[] = [];
    for (let index = 0; index < buffer.length; index++) {
        bytes[index] = Byte.fromNumberByte(buffer[index]);
    }
    return bytes;
}
