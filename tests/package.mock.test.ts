import { hexFrom, Transaction, hashTypeToBytes } from "@ckb-ccc/core";
import { readFileSync } from "fs";
import {
  Resource,
  Verifier,
  DEFAULT_SCRIPT_ALWAYS_SUCCESS,
  DEFAULT_SCRIPT_CKB_JS_VM,
} from "ckb-testtool";
import { ChunkLike, PackageDataCodec, PackageDataLike } from "../sdk/type";

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

    const chunk1: ChunkLike = {
      hash: "0x575536eafe0a9020b2087d45a522e8a4bfcfd62c",
      index: 0,
    };
    const chunk2: ChunkLike = {
      hash: "0x575536eafe0a9020b2087d45a522e8a4bfcfd62c",
      index: 1,
    };
    const originalPackage: PackageDataLike = {
      name: "0x" + "d".repeat(40),
      version: "0x" + "e".repeat(40),
      hash: "0x" + "f".repeat(40),
      chunks: [chunk1, chunk2],
    };
    const data = PackageDataCodec.encode(originalPackage);

    mainScript.args = hexFrom(
      "0x0000" +
        contractScript.codeHash.slice(2) +
        hexFrom(hashTypeToBytes(contractScript.hashType)).slice(2) +
        "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f",
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
    tx.cellDeps.push(
      Resource.createCellDep(cellDep1, "code"),
      Resource.createCellDep(cellDep2, "code"),
    );

    // 1 input cell
    const inputCell = resource.mockCell(
      alwaysSuccessScript,
      mainScript,
      "0xFF000000000000000000000000000000",
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
