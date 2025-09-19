import fs from "fs";
import path from "path";
import { normalizePath } from "./util";
import { HashFunction, ckbBlake2bHash } from "./hash";

export interface Chunk {
  path: string;
  hash: string;
  index: number;
}

export interface FileChunks {
  chunks: Array<Chunk>;
  hash: string;
  hashMethod: string; // e.g., "ckb-blake2b", "sha256"
}

/**
 * Chunks a file into smaller pieces of specified size and computes its hash.
 * @param filePath Path to the file to chunk
 * @param outputDir Directory to save the chunks
 * @param chunkSize Size of each chunk in bytes (default 300KB)
 * @param hashFn Optional hash function (default: ckbBlake2bHash)
 * @returns Object with array of chunk objects (each with path, hash, and index) and the overall file hash
 */
export async function chunkFile(
  filePath: string,
  outputDir: string,
  chunkSize: number = 300 * 1024,
  hashFn: HashFunction = ckbBlake2bHash,
): Promise<FileChunks> {
  const normalizedFilePath = normalizePath(filePath);
  const normalizedOutputDir = normalizePath(outputDir);
  const fileName = path.basename(
    normalizedFilePath,
    path.extname(normalizedFilePath),
  );
  const allData: Buffer[] = [];
  const chunks: Array<Chunk> = [];

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
      chunks.push({ path: chunkPath, hash: chunkHash, index: chunkIndex });
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
    chunks.push({ path: chunkPath, hash: chunkHash, index: chunkIndex });
  }

  const overallHash = hashFn(Buffer.concat(allData));
  return { chunks, hash: overallHash, hashMethod: hashFn.name };
}

/**
 * Merges chunks back into the original file and validates the hash.
 * @param chunks Array of chunk objects with path, hash, and index
 * @param expectedHash The expected hash of the merged file
 * @param outputPath Path where to save the merged file
 * @param hashFn Optional hash function (default: SHA256)
 * @returns Path to the merged file
 * @throws Error if hash validation fails
 */
export async function mergeChunks(
  chunks: Array<Chunk>,
  expectedHash: string,
  outputPath: string,
  hashFn: HashFunction = ckbBlake2bHash,
): Promise<string> {
  const normalizedOutputPath = normalizePath(outputPath);
  const output = fs.createWriteStream(normalizedOutputPath);

  // Sort chunks by their index to ensure correct order
  const sortedChunks = chunks.sort((a, b) => a.index - b.index);

  const allMergedData: Buffer[] = [];
  for (const chunk of sortedChunks) {
    const chunkData = await fs.promises.readFile(chunk.path);
    // Optional: verify individual chunk hash
    const chunkHash = hashFn(chunkData);
    const expectedChunkHash = chunk.hash.startsWith("0x")
      ? chunk.hash.slice(2)
      : chunk.hash;
    if (chunkHash !== expectedChunkHash) {
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
  const expectedHashNoPrefix = expectedHash.startsWith("0x")
    ? expectedHash.slice(2)
    : expectedHash;
  if (actualHash.slice(0, 40) !== expectedHashNoPrefix) {
    throw new Error(
      `Hash validation failed. Expected: ${expectedHash}, Got: 0x${actualHash.slice(0, 40)}`,
    );
  }

  return normalizedOutputPath;
}
