import fs from "fs";
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
 * @param txHash Transaction hash containing the chunks
 * @param outputPath Path where to save the reconstructed file
 * @param client CKB client instance (placeholder)
 * @returns Path to the reconstructed file
 */
export async function downloadChunks(
  cellOutpoint: { txHash: Hex; index: string },
  outputPath: string,
  client: ccc.Client,
): Promise<string> {
  const normalizedOutputPath = normalizePath(outputPath);
  const tx = await client.getTransaction(cellOutpoint.txHash);
  if (!tx) {
    throw new Error(`Transaction ${cellOutpoint.txHash} not found`);
  }
  const packageCell = tx.transaction.outputs[parseInt(cellOutpoint.index, 16)];
  if (!packageCell) {
    throw new Error(
      `Output index ${cellOutpoint.index} not found in transaction ${cellOutpoint.txHash}`,
    );
  }
  if (!packageCell.type) {
    throw new Error(
      `No type script found in output index ${cellOutpoint.index} of transaction ${cellOutpoint.txHash}`,
    );
  }

  const outputData =
    tx.transaction.outputsData[parseInt(cellOutpoint.index, 16)];
  const packageData = PackageDataCodec.decode(outputData);
  console.log(`Package data: ${JSON.stringify(packageData)}`);

  // download all the cell deps
  const chunks: Chunk[] = [];
  for (const cellDep of tx.transaction.cellDeps) {
    const cell = await client.getCellLive(cellDep.outPoint, true);
    if (!cell) {
      continue;
    }
    const hash = hashCkb(bytesFrom(cell.outputData));
    const chunk = packageData.chunks.find((c) => c.hash === hash);
    if (chunk) {
      // write the cell.outputData to a file first
      const chunkPath = `${normalizedOutputPath}.chunk${String(chunk.index + 1).padStart(3, "0")}`;
      fs.writeFileSync(chunkPath, bytesFrom(cell.outputData));
      chunks.push({ ...chunk, ...{ path: chunkPath } });
    }
  }

  const mergedPath = await mergeChunks(
    chunks,
    packageData.hash,
    normalizedOutputPath,
  );
  return mergedPath;
}
