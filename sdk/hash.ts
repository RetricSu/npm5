import crypto from "crypto";
import { hashCkb } from "@ckb-ccc/core";

export type HashFunction = (data: Buffer) => string;

export const sha256Hash: HashFunction = (data: Buffer): string => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

export const ckbBlake2bHash: HashFunction = (data: Buffer): string => {
  const hash = hashCkb(data);
  // hashCkb returns a hex string, possibly with 0x prefix
  return typeof hash === "string" && hash.startsWith("0x")
    ? hash.slice(2)
    : hash;
};
