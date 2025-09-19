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
import { bundlePackage, unbundlePackage } from "../sdk/bundle";
import { chunkFile } from "../sdk/chunk";
import { downloadChunks, publishChunks } from "../sdk/registry";
import {
  encodeUtf8ToBytes20,
  PackageDataCodec,
  PackageDataLike,
} from "../sdk/type";
import { PackageContract } from "../sdk/contract";

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

    const input = "./node_modules/ckb-testtool";
    const output = "./";
    const {
      zipFilePath: tgzPath,
      name,
      version,
    } = await bundlePackage(input, output);
    const chunkDir = `${output}/chunks`;
    const { chunks, hash } = await chunkFile(tgzPath, chunkDir, 300 * 1024);
    const publishResult = await publishChunks(chunks, toLock, signer);
    console.log("Publish result:", publishResult);

    const packageData: PackageDataLike = {
      name: encodeUtf8ToBytes20(name),
      version: encodeUtf8ToBytes20(version),
      hash: "0x" + hash.slice(0, 40),
      chunks: chunks.map((c, i) => ({
        hash: "0x" + c.hash,
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
  }, 60000);

  test("Package Contract Class", async () => {
    const input = "./node_modules/ckb-testtool";
    const contract = await PackageContract.fromBuildChunkCell(input, signer);
    const tx = await contract.buildCreatePackageCellTransaction(signer);
    await tx.completeFeeBy(signer, 1000);
    const txHash = await signer.sendTransaction(tx);
    console.log(`Transaction sent: ${txHash}`);

    const mergedPath = `./download/package`;
    const downloadPath = await downloadChunks(
      { txHash, index: "0x0" },
      mergedPath,
      client,
    );
    expect(downloadPath).toBeDefined();
  }, 60000);

  test("should download package", async () => {
    const txHash =
      "0xa7771fd7d7b7e7e27aa13bb46d12f5071cc4ce398c23e20a5a1df5388965157a";
    const mergedPath = `./download.tgz`;
    const downloadPath = await downloadChunks(
      { txHash, index: "0x0" },
      mergedPath,
      client,
    );
    expect(downloadPath).toBeDefined();

    const unbundlePath = await unbundlePackage(mergedPath, "./download");
    expect(unbundlePath).toBeDefined();
  }, 20000);
});
