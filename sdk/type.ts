import {
  BytesLike,
  mol,
  NumLike,
  Hex,
  bytesFrom,
  hexFrom,
} from "@ckb-ccc/core";

export const Bytes20Codec: mol.Codec<string, Hex> = mol.Codec.from({
  byteLength: 20,
  encode: (hex: string) => bytesFrom(hex),
  decode: (bytes: BytesLike) => hexFrom(bytes),
});

export const Bytes32Codec: mol.Codec<string, Hex> = mol.Codec.from({
  byteLength: 32,
  encode: (hex: string) => bytesFrom(hex),
  decode: (bytes: BytesLike) => hexFrom(bytes),
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
  merkleRoot: string; // 32 bytes
  chunks: Array<Chunk>; // Array of chunk objects with index and hash
}

export interface PackageDataLike {
  name: string;
  version: string;
  hash: string;
  merkleRoot: string;
  chunks: Array<ChunkLike>;
}

export const PackageDataCodec: mol.Codec<PackageDataLike, PackageData> =
  mol.table({
    name: Bytes20Codec,
    version: Bytes20Codec,
    hash: Bytes20Codec,
    merkleRoot: Bytes32Codec,
    chunks: mol.vector(ChunkCodec),
  });

export const encodeUtf8ToBytes20 = (str: string): string => {
  const buf = Buffer.from(str, "utf8");
  const truncated = buf.length > 20 ? buf.subarray(0, 20) : buf;
  const padded = Buffer.alloc(20);
  truncated.copy(padded);
  return hexFrom(padded);
};

export const decodeBytes20ToUtf8 = (hex: string): string => {
  const bytes = bytesFrom(hex);
  return Buffer.from(bytes).toString("utf8").replace(/\0+$/g, ""); // Remove trailing null characters
};
