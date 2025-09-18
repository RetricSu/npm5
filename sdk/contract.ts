import { PackageDataLike, ChunkLike } from "./type";
import { Hex } from "@ckb-ccc/core";

export class PackageDataBuilder {
  private data: PackageDataLike;

  constructor() {
    this.data = {
      name: "0x" + "0".repeat(40),
      version: "0x" + "0".repeat(40),
      hash: "0x" + "0".repeat(40),
      chunks: [],
    };
  }

  static from(chunks: ChunkLike[], hash: Hex, name?: Hex, version?: Hex) {
    const builder = new PackageDataBuilder();
    builder.setHash(hash);
    chunks.forEach((chunk) => builder.addChunk(chunk));
    if (name) {
      builder.setName(name);
    }
    if (version) {
      builder.setVersion(version);
    }
    return builder;
  }

  setName(name: string) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(name)) {
      throw new Error("Name must be a 20-byte hex string prefixed with 0x");
    }
    this.data.name = name;
    return this;
  }

  setVersion(version: string) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(version)) {
      throw new Error("Version must be a 20-byte hex string prefixed with 0x");
    }
    this.data.version = version;
    return this;
  }

  setHash(hash: string) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(hash)) {
      throw new Error("Hash must be a 20-byte hex string prefixed with 0x");
    }
    this.data.hash = hash;
    return this;
  }

  addChunk(chunk: ChunkLike) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(chunk.hash)) {
      throw new Error(
        "Chunk hash must be a 20-byte hex string prefixed with 0x",
      );
    }
    const index = Number(chunk.index);
    if (!Number.isInteger(index) || index < 0 || index > 0xffffffff) {
      throw new Error("Chunk index must be a valid u32 number");
    }
    this.data.chunks.push({ hash: chunk.hash, index });
    return this;
  }

  build(): PackageDataLike {
    return this.data;
  }
}
