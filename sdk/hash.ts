import crypto from "crypto";
import { hashCkb, hexFrom } from "@ckb-ccc/core";
import { Chunk } from "./type";
import { CkbSmt, ckb_blake2b_256 } from "../smt";

export type HashFunction = (data: Buffer) => string;

export const sha256Hash: HashFunction = (data: Buffer): string => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

export const ckbBlake2bHash: HashFunction = (data: Buffer): string => {
  return hashCkb(data).slice(2);
};

export const calcMerkleRoot = (chunks: Array<Chunk>): string => {
  const smt = new CkbSmt();

  for (const chunk of chunks.sort((a, b) => a.index - b.index)) {
    const k = ckb_blake2b_256(chunk.index);
    const v = ckb_blake2b_256(chunk.hash);
    smt.update(k, v);
  }
  const root = smt.root();
  return hexFrom(root).slice(2);
};
