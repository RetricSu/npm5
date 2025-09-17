import crypto from "crypto";
import { hashCkb } from "@ckb-ccc/core";

/**
 * Hash function interface
 */
export type HashFunction = (data: Buffer) => string;

/**
 * SHA256 hash function
 */
export const sha256Hash: HashFunction = (data: Buffer): string => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

/**
 * CKB Blake2b hash function
 */
export const ckbBlake2bHash: HashFunction = (data: Buffer): string => {
  const hash = hashCkb(data);
  // hashCkb returns a hex string, possibly with 0x prefix
  return typeof hash === "string" && hash.startsWith("0x")
    ? hash.slice(2)
    : hash;
};
