import fs from "fs";
import path from "path";
import { normalizePath } from "./util";
import {
  Transaction,
  Signer,
  hexFrom,
  ScriptLike,
  Hex,
  ccc,
  bytesFrom,
  hashCkb,
} from "@ckb-ccc/core";
import { PackageDataCodec } from "./type";
import { Chunk, mergeChunks } from "./chunk";

/**
 * Publish chunks to CKB by creating cells
 * @param chunks Array of chunk objects with path and hash
 * @param client CKB client instance (placeholder)
 * @param signer Signer for the transaction (placeholder)
 * @returns Transaction hash
 */
export async function publishChunks(
  chunks: Array<{ path: string; hash: string }>,
  toLock: ScriptLike,
  signer: Signer,
) {
  const result: { txHash: Hex; chunk: { path: string; hash: string } }[] = [];
  const dataArray = await prepareChunksData(chunks);
  for (const { data, chunk } of dataArray) {
    const tx = Transaction.from({
      outputs: [
        {
          lock: toLock,
        },
      ],
      outputsData: [data],
    });
    await tx.completeInputsAll(signer);
    await tx.completeFeeBy(signer, 1000);
    const txHash = await signer.sendTransaction(tx);
    console.log(`Published chunk ${chunk.path} in tx ${txHash}`);
    result.push({
      txHash,
      chunk,
    });
  }

  return result;
}

export async function prepareChunksData(
  chunks: Array<{ path: string; hash: string }>,
) {
  const result: { data: Hex; chunk: { path: string; hash: string } }[] = [];

  for (const chunk of chunks) {
    const chunkPath = normalizePath(chunk.path);
    const cellData = fs.readFileSync(chunkPath);
    result.push({ data: hexFrom(cellData), chunk });
  }
  return result;
}

/**
 * Download chunks from CKB cells and reconstruct the file
 * @param packageCellOutpoint Transaction hash and index containing the chunks
 * @param outputFile Path where to save the reconstructed file
 * @param client CKB client instance
 * @returns Path to the reconstructed file
 *
 * Note: This function creates temporary chunk files in a subdirectory during processing
 * and cleans them up automatically after reconstruction.
 */
export async function downloadAndMergeChunks(
  packageCellOutpoint: { txHash: Hex; index: Hex },
  outputFile: string,
  client: ccc.Client,
): Promise<string> {
  // Ensure output directory exists
  const normalizedOutputFilePath = normalizePath(outputFile);
  fs.mkdirSync(path.dirname(normalizedOutputFilePath), { recursive: true });

  const tx = await client.getTransaction(packageCellOutpoint.txHash);
  if (!tx) {
    throw new Error(`Transaction ${packageCellOutpoint.txHash} not found`);
  }
  const packageCell =
    tx.transaction.outputs[parseInt(packageCellOutpoint.index, 16)];
  if (!packageCell) {
    throw new Error(
      `Output index ${packageCellOutpoint.index} not found in transaction ${packageCellOutpoint.txHash}`,
    );
  }
  if (!packageCell.type) {
    throw new Error(
      `No type script found in output index ${packageCellOutpoint.index} of transaction ${packageCellOutpoint.txHash}`,
    );
  }

  const outputData =
    tx.transaction.outputsData[parseInt(packageCellOutpoint.index, 16)];
  const packageData = PackageDataCodec.decode(outputData);
  console.log(`Package data: ${JSON.stringify(packageData)}`);

  // Create a temporary directory for chunks to avoid polluting the output directory
  const outputDir = path.dirname(normalizedOutputFilePath);
  const tempDir = path.resolve(outputDir, "temp_chunks_" + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

  // download all the cell deps
  const chunks: Chunk[] = [];
  try {
    for (const cellDep of tx.transaction.cellDeps) {
      const cell = await client.getCellLive(cellDep.outPoint, true);
      if (!cell) {
        continue;
      }

      const hash = hashCkb(bytesFrom(cell.outputData));
      const chunk = packageData.chunks.find((c) => c.hash === hash);
      if (chunk) {
        // write the cell.outputData to a temporary chunk file
        const chunkPath = path.join(
          tempDir,
          `chunk${String(chunk.index + 1).padStart(3, "0")}`,
        );
        fs.writeFileSync(chunkPath, bytesFrom(cell.outputData));
        chunks.push({ ...chunk, ...{ path: chunkPath } });
      }
    }

    const mergedFilePath = await mergeChunks(
      chunks,
      packageData.hash,
      normalizedOutputFilePath,
    );

    return mergedFilePath;
  } finally {
    // Clean up temporary directory and all chunk files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
      console.warn(`Failed to cleanup temporary directory: ${tempDir}`);
    }
  }
}
