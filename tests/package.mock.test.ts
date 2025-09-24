import { hexFrom, Transaction, hashTypeToBytes, hashCkb } from "@ckb-ccc/core";
import { readFileSync } from "fs";
import {
  Resource,
  Verifier,
  DEFAULT_SCRIPT_ALWAYS_SUCCESS,
  DEFAULT_SCRIPT_CKB_JS_VM,
} from "ckb-testtool";
import {
  ChunkLike,
  encodeUtf8ToBytes20,
  PackageDataCodec,
  PackageDataLike,
} from "../sdk/type";

describe("package contract", () => {
  test("should execute successfully", async () => {
    const resource = Resource.default();
    const tx = Transaction.default();

    const mainScript = resource.deployCell(
      hexFrom(readFileSync(DEFAULT_SCRIPT_CKB_JS_VM)),
      tx,
      false,
    );
    const alwaysSuccessScript = resource.deployCell(
      hexFrom(readFileSync(DEFAULT_SCRIPT_ALWAYS_SUCCESS)),
      tx,
      false,
    );
    const contractScript = resource.deployCell(
      hexFrom(readFileSync("dist/package.bc")),
      tx,
      false,
    );

    // cell deps
    const cellDep1 = resource.mockCell(
      alwaysSuccessScript,
      undefined,
      "0xFF000000000000000000000000000000",
    );
    const cellDep2 = resource.mockCell(
      alwaysSuccessScript,
      undefined,
      "0xFF000000000000000000000000000000",
    );
    const chunk1: ChunkLike = {
      hash: hashCkb(cellDep1.outputData),
      index: 0,
    };
    const chunk2: ChunkLike = {
      hash: hashCkb(cellDep2.outputData),
      index: 1,
    };
    const previousPackage: PackageDataLike = {
      name: "0x" + "d".repeat(40),
      version: encodeUtf8ToBytes20("1.0.0"),
      hash: "0x" + "f".repeat(40),
      chunks: [chunk1, chunk2],
    };
    const previousData = PackageDataCodec.encode(previousPackage);
    const updatedPackage: PackageDataLike = {
      name: "0x" + "d".repeat(40),
      version: encodeUtf8ToBytes20("1.0.1"),
      hash: "0x" + "f".repeat(40),
      chunks: [chunk1, chunk2],
    };
    const data = PackageDataCodec.encode(updatedPackage);

    mainScript.args = hexFrom(
      "0x0000" +
        contractScript.codeHash.slice(2) +
        hexFrom(hashTypeToBytes(contractScript.hashType)).slice(2) +
        "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f",
    );

    tx.cellDeps.push(
      Resource.createCellDep(cellDep1, "code"),
      Resource.createCellDep(cellDep2, "code"),
    );

    // 1 input cell
    const inputCell = resource.mockCell(
      alwaysSuccessScript,
      mainScript,
      hexFrom(previousData),
    );
    tx.inputs.push(Resource.createCellInput(inputCell));

    // 2 output cells
    tx.outputs.push(Resource.createCellOutput(alwaysSuccessScript, mainScript));
    tx.outputsData.push(hexFrom(data));
    tx.outputs.push(Resource.createCellOutput(alwaysSuccessScript));
    tx.outputsData.push(hexFrom("0x01000000000000000000000000000000"));

    const verifier = Verifier.from(resource, tx);
    // if you are using the native ckb-debugger, you can delete the following line.
    verifier.setWasmDebuggerEnabled(true);
    await verifier.verifySuccess(true);
  });
});
