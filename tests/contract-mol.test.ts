import {
  Bytes20Codec,
  ChunkCodec,
  PackageDataCodec,
  ChunkLike,
  PackageDataLike,
} from "../sdk/type";

describe("Bytes20Codec", () => {
  it("should encode and decode a 20-byte hex string", () => {
    const originalHex = "0x" + "a".repeat(40); // 20 bytes
    const encoded = Bytes20Codec.encode(originalHex);
    const decoded = Bytes20Codec.decode(encoded);
    expect(decoded).toBe(originalHex);
  });
});

describe("ChunkCodec", () => {
  it("should encode and decode a Chunk", () => {
    const originalChunk: ChunkLike = {
      hash: "0x" + "b".repeat(40),
      index: 123,
    };
    const encoded = ChunkCodec.encode(originalChunk);
    const decoded = ChunkCodec.decode(encoded);
    expect(decoded.hash).toBe(originalChunk.hash);
    expect(decoded.index).toBe(originalChunk.index);
  });
});

describe("PackageDataCodec", () => {
  it("should encode and decode PackageData", () => {
    const chunk: ChunkLike = {
      hash: "0x" + "c".repeat(40),
      index: 456,
    };
    const originalPackage: PackageDataLike = {
      name: "0x" + "d".repeat(40),
      version: "0x" + "e".repeat(40),
      hash: "0x" + "f".repeat(40),
      chunks: [chunk],
    };
    const encoded = PackageDataCodec.encode(originalPackage);
    const decoded = PackageDataCodec.decode(encoded);
    expect(decoded.name).toBe(originalPackage.name);
    expect(decoded.version).toBe(originalPackage.version);
    expect(decoded.hash).toBe(originalPackage.hash);
    expect(decoded.chunks.length).toBe(1);
    expect(decoded.chunks[0].hash).toBe(chunk.hash);
    expect(decoded.chunks[0].index).toBe(chunk.index);
  });
});
