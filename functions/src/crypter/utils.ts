import assert from 'assert-ts';

/**
 * Bits of a byte.
 * @param { number } byte Byte to get bits from.
 * @return { number } Bits of specified byte.
 */
export function bits(byte: number): (0 | 1)[] {
    const totalBitsCount = 8;
    const bitsArray = Array<0 | 1>(totalBitsCount).fill(0);
    for (let index = 0; index < totalBitsCount; index++) {
        const bit = byte % 0x02;
        byte = (byte - bit) / 0x02;
        bitsArray[totalBitsCount - index - 1] = bit === 0 ? 0 : 1;
    }
    assert(byte === 0, 'Value isn\'t a valid byte.');
    return bitsArray;
}

/**
 * 
 * @param { 0 | 1 } bit1 
 * @param { 0 | 1 } bit2 
 * @return { 0 | 1 } 
 */
export function xor(bit1: 0 | 1, bit2: 0 | 1): 0 | 1 {
    if (bit1 == bit2) return 0;
    else return 1;
}

/**
 * 
 * @param { Iterator<0 | 1> } iterator 
 * @return { Buffer } 
 */
export function bitIteratorToBuffer(iterator: Iterator<0 | 1>): Buffer {
    const bytes: number[] = [];
    let currentByte = 0;
    let index = 0;
    let iteratorResult = iterator.next();
    while (!(iteratorResult.done ?? false)) {
        currentByte += iteratorResult.value * (1 << (7 - index));
        iteratorResult = iterator.next();
        index += 1;
        if (index == 8) {
            bytes.push(currentByte);
            currentByte = 0;
            index = 0;
        }
    }
    return Buffer.from(bytes);
}

/**
 * Generates an utf-8 key with specified length.
 * @param { number } length Length of key to generate.
 * @return { string } Generated key.
 */
export function randomKey(length: number): string {
    let string = '';
    for (let index = 0; index < length; index++) {
        string += String.fromCharCode(Math.random() * 93 + 33);
    }
    return string;
}
