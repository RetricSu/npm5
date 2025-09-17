import fs from "fs";
import path from "path";
import crypto from "crypto";
import { normalizePath } from "./util";
import { HashFunction, ckbBlake2bHash } from "./hash";

/**
 * Chunks a file into smaller pieces of specified size and computes its hash.
 * @param filePath Path to the file to chunk
 * @param outputDir Directory to save the chunks
 * @param chunkSize Size of each chunk in bytes (default 300KB)
 * @param hashFn Optional hash function (default: SHA256)
 * @returns Object with array of chunk objects (each with path and hash) and the overall file hash
 */
export async function chunkFile(
  filePath: string,
  outputDir: string,
  chunkSize: number = 300 * 1024,
  hashFn: HashFunction = ckbBlake2bHash,
): Promise<{ chunks: Array<{ path: string; hash: string }>; hash: string }> {
  const normalizedFilePath = normalizePath(filePath);
  const normalizedOutputDir = normalizePath(outputDir);
  const fileName = path.basename(
    normalizedFilePath,
    path.extname(normalizedFilePath),
  );
  const allData: Buffer[] = [];
  const chunks: Array<{ path: string; hash: string }> = [];

  // Ensure output directory exists
  await fs.promises.mkdir(normalizedOutputDir, { recursive: true });

  const input = fs.createReadStream(normalizedFilePath);
  let chunkIndex = 0;
  let currentChunk: Buffer[] = [];
  let currentSize = 0;

  for await (const chunk of input) {
    allData.push(chunk);
    currentChunk.push(chunk);
    currentSize += chunk.length;

    while (currentSize >= chunkSize) {
      const chunkData = Buffer.concat(currentChunk);
      const chunkPath = path.join(
        normalizedOutputDir,
        `${fileName}.chunk${String(chunkIndex + 1).padStart(3, "0")}`,
      );
      const chunkHash = hashFn(chunkData.slice(0, chunkSize));
      await fs.promises.writeFile(chunkPath, chunkData.slice(0, chunkSize));
      chunks.push({ path: chunkPath, hash: chunkHash });
      chunkIndex++;

      const remaining = chunkData.slice(chunkSize);
      currentChunk = remaining.length > 0 ? [remaining] : [];
      currentSize = remaining.length;
    }
  }

  // Write remaining data as last chunk
  if (currentChunk.length > 0) {
    const chunkData = Buffer.concat(currentChunk);
    const chunkPath = path.join(
      normalizedOutputDir,
      `${fileName}.chunk${String(chunkIndex + 1).padStart(3, "0")}`,
    );
    const chunkHash = hashFn(chunkData);
    await fs.promises.writeFile(chunkPath, chunkData);
    chunks.push({ path: chunkPath, hash: chunkHash });
  }

  const overallHash = hashFn(Buffer.concat(allData));
  return { chunks, hash: overallHash };
}

/**
 * Merges chunks back into the original file and validates the hash.
 * @param chunks Array of chunk objects with path and hash
 * @param expectedHash The expected hash of the merged file
 * @param outputPath Path where to save the merged file
 * @param hashFn Optional hash function (default: SHA256)
 * @returns Path to the merged file
 * @throws Error if hash validation fails
 */
export async function mergeChunks(
  chunks: Array<{ path: string; hash: string }>,
  expectedHash: string,
  outputPath: string,
  hashFn: HashFunction = ckbBlake2bHash,
): Promise<string> {
  const normalizedOutputPath = normalizePath(outputPath);
  const output = fs.createWriteStream(normalizedOutputPath);
  const hash = crypto.createHash("sha256"); // For accumulating data, but we'll use hashFn at the end

  // Sort chunks by their number to ensure correct order
  const sortedChunks = chunks.sort((a, b) => {
    const aMatch = a.path.match(/\.chunk(\d+)$/);
    const bMatch = b.path.match(/\.chunk(\d+)$/);
    return parseInt(aMatch![1]) - parseInt(bMatch![1]);
  });

  const allMergedData: Buffer[] = [];
  for (const chunk of sortedChunks) {
    const chunkData = await fs.promises.readFile(chunk.path);
    // Optional: verify individual chunk hash
    const chunkHash = hashFn(chunkData);
    if (chunkHash !== chunk.hash) {
      throw new Error(`Chunk ${chunk.path} hash validation failed`);
    }
    allMergedData.push(chunkData);
    output.write(chunkData);
  }

  output.end();
  await new Promise<void>((resolve, reject) => {
    output.on("finish", () => resolve());
    output.on("error", reject);
  });

  const actualHash = hashFn(Buffer.concat(allMergedData));
  if (actualHash !== expectedHash) {
    throw new Error(
      `Hash validation failed. Expected: ${expectedHash}, Got: ${actualHash}`,
    );
  }

  return normalizedOutputPath;
}
