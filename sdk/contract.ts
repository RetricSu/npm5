import {
  PackageDataLike,
  PackageData,
  PackageDataCodec,
  encodeUtf8ToBytes20,
  decodeBytes20ToUtf8,
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
import fs from "fs";
import os from "os";

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
    outputDir?: string,
    chunkSize = 300 * 1024, // 300 KB
  ): Promise<PackageContract> {
    // Use temp directory if no outputDir specified
    const useTempDir = !outputDir;
    const tempDir = useTempDir
      ? path.join(os.tmpdir(), `npm5-build-${Date.now()}`)
      : undefined;
    const actualOutputDir = outputDir || tempDir!;

    try {
      const {
        zipFilePath: tgzPath,
        name,
        version,
      } = await bundlePackage(packageFolderPath, actualOutputDir);
      const chunkDir = `${actualOutputDir}/chunks`;
      const { chunks, hash, merkleRoot } = await chunkFile(
        tgzPath,
        chunkDir,
        chunkSize,
      );

      const signerLock = (await signer.getRecommendedAddressObj()).script;
      const toLock = {
        codeHash: signerLock.codeHash,
        hashType: signerLock.hashType,
        args: signerLock.args,
      };
      // check if we have enough capacity to store all chunks
      const balance = await signer.client.getBalanceSingle(signerLock);
      const fileSizeInBytes = fs.statSync(tgzPath).size;
      if (balance < BigInt(fileSizeInBytes)) {
        throw new Error(
          `Not enough CKB balance to publish package chunks. Required: ${fileSizeInBytes}, Available: ${balance.toString(10)}`,
        );
      }

      const chunkCells = await publishChunks(chunks, toLock, signer);

      const packageData: PackageDataLike = {
        name: encodeUtf8ToBytes20(name),
        version: encodeUtf8ToBytes20(version),
        hash: "0x" + hash.slice(0, 40),
        merkleRoot: merkleRoot,
        chunks: chunks.map((c, i) => ({
          hash: "0x" + c.hash,
          index: i,
        })),
      };

      return new PackageContract(packageData, chunkCells);
    } finally {
      // Clean up temp directory if we created one
      if (useTempDir && tempDir) {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (error) {
          // Ignore cleanup errors
          console.warn(`Failed to clean up temp directory ${tempDir}:`, error);
        }
      }
    }
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
    const { mergedFilePath: mergedFile, packageData } =
      await downloadAndMergeChunks(packageCellOutpoint, tempFile, client);

    await unbundlePackage(mergedFile, outputDir);

    const packageName = decodeBytes20ToUtf8(packageData.name);
    const packageVersion = decodeBytes20ToUtf8(packageData.version);

    console.log(`Downloaded package: ${packageName}@${packageVersion}`);

    const unbundlePath = path.join(normalizePath(outputDir), packageName);
    return unbundlePath;
  }

  async buildCreatePackageCellTransaction(
    signer: ccc.Signer,
    network: "devnet" | "testnet" | "mainnet" = "devnet",
  ): Promise<ccc.Transaction> {
    // @ts-ignore
    const ckbJsVmScript = systemScripts[network]["ckb_js_vm"];
    // @ts-ignore
    const contractScript = scripts[network]["package.bc"];

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
        ...ckbJsVmScript.script.cellDeps.map(
          (c: { cellDep: CellDepLike }) => c.cellDep,
        ),
        ...contractScript.cellDeps.map(
          (c: { cellDep: CellDepLike }) => c.cellDep,
        ),
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

    console.log(
      `Package Type ID: ${typeId}, Type Hash: ${tx.outputs[0].type!.hash()}`,
    );

    return tx;
  }
}
