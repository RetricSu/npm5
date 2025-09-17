import fs from "fs";
import { normalizePath } from "./util";
import { Transaction, Signer, hexFrom, ScriptLike, Hex } from "@ckb-ccc/core";

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
  txHash: string,
  outputPath: string,
  client: any, // TODO: Use proper Client type
): Promise<string> {
  const normalizedOutputPath = normalizePath(outputPath);
  const output = fs.createWriteStream(normalizedOutputPath);

  // TODO: Query CKB to get cell data
  // Example:
  // const tx = await client.getTransaction(txHash);
  // for (const outputData of tx.transaction.outputsData) {
  //   const cellData = Buffer.from(outputData, 'hex');
  //   output.write(cellData);
  // }

  console.log(`Would download chunks from transaction ${txHash}`);

  // Placeholder: create empty file for now
  output.end();
  await new Promise<void>((resolve, reject) => {
    output.on("finish", () => resolve());
    output.on("error", reject);
  });

  return normalizedOutputPath;
}
