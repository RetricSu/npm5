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
import { bundlePackage, unbundlePackage } from "../sdk/bundle";
import { chunkFile } from "../sdk/chunk";
import { downloadAndMergeChunks, publishChunks } from "../sdk/registry";
import systemScripts from "../deployment/system-scripts.json";
import scripts from "../deployment/scripts.json";
import { normalizePath } from "./util";
import path from "path";

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

  static async buildFromPublishingChunkCells(
    packageFolderPath: string,
    signer: ccc.Signer,
    outputDir = "./",
    chunkSize = 300 * 1024, // 300 KB
  ): Promise<PackageContract> {
    const {
      zipFilePath: tgzPath,
      name,
      version,
    } = await bundlePackage(packageFolderPath, outputDir);
    const chunkDir = `${outputDir}/chunks`;
    const { chunks, hash } = await chunkFile(tgzPath, chunkDir, chunkSize);

    const signerLock = (await signer.getRecommendedAddressObj()).script;
    const toLock = {
      codeHash: signerLock.codeHash,
      hashType: signerLock.hashType,
      args: signerLock.args,
    };
    const chunkCells = await publishChunks(chunks, toLock, signer);

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

  static async downloadPackage(
    packageCellOutpoint: {
      txHash: Hex;
      index: Hex;
    },
    outputDir: string,
    client: ccc.Client,
  ): Promise<string> {
    // Create a temporary directory for mergedFile to avoid polluting the output directory
    const normalizedOutputDir = normalizePath(outputDir);
    const tempFile = path.resolve(
      normalizedOutputDir,
      ".mergedFile" + Date.now(),
    );
    const mergedFile = await downloadAndMergeChunks(
      packageCellOutpoint,
      tempFile,
      client,
    );

    const unbundlePath = await unbundlePackage(mergedFile, outputDir);
    return unbundlePath;
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
