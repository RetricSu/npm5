import {
  hexFrom,
  ccc,
  hashTypeToBytes,
  CellDepLike,
  hashTypeId,
} from "@ckb-ccc/core";
import scripts from "../deployment/scripts.json";
import systemScripts from "../deployment/system-scripts.json";
import { buildClient, buildSigner } from "./helper";
import { bundlePackage } from "../sdk/bundle";
import { chunkFile } from "../sdk/chunk";
import { publishChunks } from "../sdk/registry";
import { PackageDataCodec, PackageDataLike } from "../sdk/type";

describe("package contract devnet", () => {
  let client: ccc.Client;
  let signer: ccc.SignerCkbPrivateKey;

  beforeAll(() => {
    // Create global devnet client and signer for all tests in this describe block
    client = buildClient("devnet");
    signer = buildSigner(client);
  });

  test("placeholder package test", async () => {
    const ckbJsVmScript = systemScripts.devnet["ckb_js_vm"];
    const contractScript = scripts.devnet["package.bc"];

    const mainScript = {
      codeHash: ckbJsVmScript.script.codeHash,
      hashType: ckbJsVmScript.script.hashType,
      args: hexFrom(
        "0x0000" +
          contractScript.codeHash.slice(2) +
          hexFrom(hashTypeToBytes(contractScript.hashType)).slice(2) +
          "0000000000000000000000000000000000000000000000000000000000000000",
      ),
    };

    const signerLock = (await signer.getRecommendedAddressObj()).script;
    const toLock = {
      codeHash: signerLock.codeHash,
      hashType: signerLock.hashType,
      args: signerLock.args,
    };

    const input = "~/Desktop/offckb-placeholder";
    const output = "~/Desktop/npm5";
    const tgzPath = await bundlePackage(input, output);
    const chunkDir = `${output}/chunks`;
    const { chunks, hash } = await chunkFile(tgzPath, chunkDir, 500 * 1024);
    const publishResult = await publishChunks(chunks, toLock, signer);
    console.log("Publish result:", publishResult);

    const packageData: PackageDataLike = {
      name: "0x" + "d".repeat(40),
      version: "0x" + "e".repeat(40),
      hash: "0x" + hash.slice(0, 40),
      chunks: chunks.map((c, i) => ({
        hash: "0x" + c.hash.slice(0, 40),
        index: i,
      })),
    };
    const data = PackageDataCodec.encode(packageData);

    // compose transaction
    const tx = ccc.Transaction.from({
      outputs: [
        {
          lock: toLock,
          type: mainScript,
        },
      ],
      outputsData: [data],
      cellDeps: [
        ...ckbJsVmScript.script.cellDeps.map((c) => c.cellDep),
        ...contractScript.cellDeps.map((c) => c.cellDep),
        ...publishResult.flatMap((r) => {
          const cellDep: CellDepLike = {
            outPoint: {
              txHash: r.txHash,
              index: "0x0",
            },
            depType: "code",
          };
          return cellDep;
        }),
      ],
    });

    await tx.completeInputsAll(signer);
    const typeId = hashTypeId(tx.inputs[0], 0);
    tx.outputs[0].type!.args = hexFrom(
      "0x0000" +
        contractScript.codeHash.slice(2) +
        hexFrom(hashTypeToBytes(contractScript.hashType)).slice(2) +
        typeId.slice(2),
    );

    await tx.completeFeeBy(signer, 1000);
    const txHash = await signer.sendTransaction(tx);
    console.log(`Transaction sent: ${txHash}`);
  });
});
