import {
  CELL_FIELD_CAPACITY,
  loadCellByField,
  SourceType,
} from "@ckb-js-std/bindings";
import * as binding from "@ckb-js-std/bindings";

/**
 * Checks if a cell exists at the specified index and source
 * @internal
 */
export function isCellPresent(index: number, source: SourceType): boolean {
  try {
    // capacity is the smallest field in a cell, better performance.
    loadCellByField(index, source, CELL_FIELD_CAPACITY);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Encodes a string to UTF-8 bytes
 * @internal
 */
function encodeUTF8(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6));
      bytes.push(0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes.push(0xe0 | (code >> 12));
      bytes.push(0x80 | ((code >> 6) & 0x3f));
      bytes.push(0x80 | (code & 0x3f));
    } else {
      // surrogate pair
      i++;
      const hi = code;
      const lo = str.charCodeAt(i);
      const codePoint = 0x10000 + (((hi & 0x3ff) << 10) | (lo & 0x3ff));
      bytes.push(0xf0 | (codePoint >> 18));
      bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
      bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
      bytes.push(0x80 | (codePoint & 0x3f));
    }
  }
  return bytes;
}

/**
 * Decodes UTF-8 bytes to a string
 * @internal
 */
function decodeUTF8(bytes: number[]): string {
  let str = "";
  let i = 0;
  while (i < bytes.length) {
    const byte = bytes[i];
    if (byte < 0x80) {
      str += String.fromCharCode(byte);
      i++;
    } else if (byte < 0xe0) {
      const code = ((byte & 0x1f) << 6) | (bytes[i + 1] & 0x3f);
      str += String.fromCharCode(code);
      i += 2;
    } else if (byte < 0xf0) {
      const code =
        ((byte & 0x0f) << 12) |
        ((bytes[i + 1] & 0x3f) << 6) |
        (bytes[i + 2] & 0x3f);
      str += String.fromCharCode(code);
      i += 3;
    } else {
      const codePoint =
        ((byte & 0x07) << 18) |
        ((bytes[i + 1] & 0x3f) << 12) |
        ((bytes[i + 2] & 0x3f) << 6) |
        (bytes[i + 3] & 0x3f);
      str += String.fromCodePoint(codePoint);
      i += 4;
    }
  }
  return str;
}

export const encodeUtf8ToBytes20 = (str: string): string => {
  const bytes = encodeUTF8(str);
  const truncated = bytes.length > 20 ? bytes.slice(0, 20) : bytes;
  const padded = new Array(20).fill(0);
  for (let i = 0; i < truncated.length; i++) {
    padded[i] = truncated[i];
  }
  return binding.hex.encode(new Uint8Array(padded).buffer);
};

export const decodeBytes20ToUtf8 = (hex: string): string => {
  const bytes = Array.from(new Uint8Array(binding.hex.decode(hex)));
  return decodeUTF8(bytes).replace(/\0+$/g, ""); // Remove trailing null characters
};
