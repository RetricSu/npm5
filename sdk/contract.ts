import {
  PackageDataLike,
  PackageData,
  PackageDataCodec,
  encodeUtf8ToBytes20,
} from "./type";
import {
  ccc,
  CellDepLike,
  hashTypeId,
  hashTypeToBytes,
  Hex,
  hexFrom,
} from "@ckb-ccc/core";
import { bundlePackage } from "../sdk/bundle";
import { chunkFile } from "../sdk/chunk";
import { publishChunks } from "../sdk/registry";
import systemScripts from "../deployment/system-scripts.json";
import scripts from "../deployment/scripts.json";

export class PackageContract {
  private data: PackageData;
  private chunkCells: {
    txHash: Hex;
    chunk: {
      path: string;
      hash: string;
    };
  }[] = [];

  constructor(
    data: PackageDataLike,
    chunkCells: { txHash: Hex; chunk: { path: string; hash: string } }[] = [],
  ) {
    this.data = PackageDataCodec.decode(PackageDataCodec.encode(data));
    this.chunkCells = chunkCells;
  }

  static async fromBuildChunkCell(
    jsPackagePath: string,
    signer: ccc.Signer,
    outputPath = "./",
  ): Promise<PackageContract> {
    const {
      zipFilePath: tgzPath,
      name,
      version,
    } = await bundlePackage(jsPackagePath, outputPath);
    const chunkDir = `${outputPath}/chunks`;
    const { chunks, hash } = await chunkFile(tgzPath, chunkDir, 300 * 1024);

    const signerLock = (await signer.getRecommendedAddressObj()).script;
    const toLock = {
      codeHash: signerLock.codeHash,
      hashType: signerLock.hashType,
      args: signerLock.args,
    };
    const chunkCells = await publishChunks(chunks, toLock, signer);

    console.log(`Package name: ${name}, version: ${version}`);

    const packageData: PackageDataLike = {
      name: encodeUtf8ToBytes20(name),
      version: encodeUtf8ToBytes20(version),
      hash: "0x" + hash.slice(0, 40),
      chunks: chunks.map((c, i) => ({
        hash: "0x" + c.hash,
        index: i,
      })),
    };

    return new PackageContract(packageData, chunkCells);
  }

  async buildCreatePackageCellTransaction(
    signer: ccc.Signer,
  ): Promise<ccc.Transaction> {
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

    const data = PackageDataCodec.encode(this.data);

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
        ...this.chunkCells.flatMap((r) => {
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

    return tx;
  }
}
