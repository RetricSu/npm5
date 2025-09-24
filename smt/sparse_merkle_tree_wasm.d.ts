/* tslint:disable */
/* eslint-disable */
export function ckb_blake2b_256(d: any): Uint8Array;
export function verify_proof(
  root: Uint8Array,
  proof: Uint8Array,
  leaves: Array<any>,
): boolean;
export class CkbSmt {
  free(): void;
  constructor();
  root(): Uint8Array;
  update(key: Uint8Array, val: Uint8Array): void;
  get_proof(keys: Uint8Array[]): Uint8Array;
}
