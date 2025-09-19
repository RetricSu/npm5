import { BytesLike, mol, NumLike } from "@ckb-js-std/core";
import * as bindings from "@ckb-js-std/bindings";

export type Hex = `0x${string}`;

export const Bytes20Codec: mol.Codec<string, Hex> = mol.Codec.from({
  byteLength: 20,
  encode: (hex: string) => bindings.hex.decode(hex),
  decode: (bytes: BytesLike) => bindings.hex.encode(bytes) as Hex,
});

export const Bytes32Codec: mol.Codec<string, Hex> = mol.Codec.from({
  byteLength: 32,
  encode: (hex: string) => bindings.hex.decode(hex),
  decode: (bytes: BytesLike) => bindings.hex.encode(bytes) as Hex,
});

export interface Chunk {
  hash: string; // 32 bytes
  index: number; // 4 bytes, u32
}

export interface ChunkLike {
  hash: string; // 32 bytes
  index: NumLike; // 4 bytes, u32
}

export const ChunkCodec: mol.Codec<ChunkLike, Chunk> = mol.table({
  hash: Bytes32Codec,
  index: mol.Uint32,
});

export interface PackageData {
  name: string; // utf8 string, 20 bytes
  version: string; // utf8 string, 20 bytes
  hash: string; // Hash of the full package file, 20 bytes
  chunks: Array<Chunk>; // Array of chunk objects with index and hash
}

export interface PackageDataLike {
  name: string;
  version: string;
  hash: string;
  chunks: Array<ChunkLike>;
}

export const PackageDataCodec: mol.Codec<PackageDataLike, PackageData> =
  mol.table({
    name: Bytes20Codec,
    version: Bytes20Codec,
    hash: Bytes20Codec,
    chunks: mol.vector(ChunkCodec),
  });
