import nacl from "tweetnacl";
import { secretKey } from './keys.js';


export const host = 'api.dmarket.com';


function byteToHexString(uint8arr) {
    if (!uint8arr) {
        return '';
    }

    let hexStr = '';
    const radix = 16;
    const magicNumber = 0xff;
    for (let i = 0; i < uint8arr.length; i++) {
        let hex = (uint8arr[i] & magicNumber).toString(radix);
        hex = (hex.length === 1) ? '0' + hex : hex;
        hexStr += hex;
    }

    return hexStr;
}

function hexStringToByte(str) {
    if (typeof str !== 'string') {
        throw new TypeError('Wrong data type passed to convertor. Hexadecimal string is expected');
    }
    const twoNum = 2;
    const radix = 16;
    const uInt8arr = new Uint8Array(str.length / twoNum);
    for (let i = 0, j = 0; i < str.length; i += twoNum, j++) {
        uInt8arr[j] = parseInt(str.substr(i, twoNum), radix);
    }
    return uInt8arr;
}

export function hex2ascii(hexx) {
    const hex = hexx.toString();
    let str = '';
    for (let i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

export function sign(string) {
    const signatureBytes = nacl.sign(new TextEncoder('utf-8').encode(string), hexStringToByte(secretKey));
    return byteToHexString(signatureBytes).substr(0,128);
}

export function swapChars(str) {
    return encodeURIComponent(str).split('').map(char => {
        switch (char) {
            case "'":
                return '%27';
            case '[':
                return '%5B';
            case ']':
                return '%5D';
            default:
                return char;
        }
    }).join('');
}