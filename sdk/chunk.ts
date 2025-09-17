import fs from "fs";
import path from "path";
import crypto from "crypto";
import { normalizePath } from "./util";

/**
 * Chunks a file into smaller pieces of specified size and computes its SHA256 hash.
 * @param filePath Path to the file to chunk
 * @param outputDir Directory to save the chunks
 * @param chunkSize Size of each chunk in bytes (default 300KB)
 * @returns Object with array of chunk objects (each with path and hash) and the overall file hash
 */
export async function chunkFile(
  filePath: string,
  outputDir: string,
  chunkSize: number = 300 * 1024,
): Promise<{ chunks: Array<{ path: string; hash: string }>; hash: string }> {
  const normalizedFilePath = normalizePath(filePath);
  const normalizedOutputDir = normalizePath(outputDir);
  const fileName = path.basename(
    normalizedFilePath,
    path.extname(normalizedFilePath),
  );
  const hash = crypto.createHash("sha256");
  const chunks: Array<{ path: string; hash: string }> = [];

  // Ensure output directory exists
  await fs.promises.mkdir(normalizedOutputDir, { recursive: true });

  const input = fs.createReadStream(normalizedFilePath);
  let chunkIndex = 0;
  let currentChunk: Buffer[] = [];
  let currentSize = 0;

  for await (const chunk of input) {
    hash.update(chunk);
    currentChunk.push(chunk);
    currentSize += chunk.length;

    while (currentSize >= chunkSize) {
      const chunkData = Buffer.concat(currentChunk);
      const chunkPath = path.join(
        normalizedOutputDir,
        `${fileName}.chunk${String(chunkIndex + 1).padStart(3, "0")}`,
      );
      const chunkHash = crypto
        .createHash("sha256")
        .update(chunkData.slice(0, chunkSize))
        .digest("hex");
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
    const chunkHash = crypto
      .createHash("sha256")
      .update(chunkData)
      .digest("hex");
    await fs.promises.writeFile(chunkPath, chunkData);
    chunks.push({ path: chunkPath, hash: chunkHash });
  }

  return { chunks, hash: hash.digest("hex") };
}

/**
 * Merges chunks back into the original file and validates the hash.
 * @param chunks Array of chunk objects with path and hash
 * @param expectedHash The expected SHA256 hash of the merged file
 * @param outputPath Path where to save the merged file
 * @returns Path to the merged file
 * @throws Error if hash validation fails
 */
export async function mergeChunks(
  chunks: Array<{ path: string; hash: string }>,
  expectedHash: string,
  outputPath: string,
): Promise<string> {
  const normalizedOutputPath = normalizePath(outputPath);
  const output = fs.createWriteStream(normalizedOutputPath);
  const hash = crypto.createHash("sha256");

  // Sort chunks by their number to ensure correct order
  const sortedChunks = chunks.sort((a, b) => {
    const aMatch = a.path.match(/\.chunk(\d+)$/);
    const bMatch = b.path.match(/\.chunk(\d+)$/);
    return parseInt(aMatch![1]) - parseInt(bMatch![1]);
  });

  for (const chunk of sortedChunks) {
    const chunkData = await fs.promises.readFile(chunk.path);
    // Optional: verify individual chunk hash
    const chunkHash = crypto
      .createHash("sha256")
      .update(chunkData)
      .digest("hex");
    if (chunkHash !== chunk.hash) {
      throw new Error(`Chunk ${chunk.path} hash validation failed`);
    }
    hash.update(chunkData);
    output.write(chunkData);
  }

  output.end();
  await new Promise<void>((resolve, reject) => {
    output.on("finish", () => resolve());
    output.on("error", reject);
  });

  const actualHash = hash.digest("hex");
  if (actualHash !== expectedHash) {
    throw new Error(
      `Hash validation failed. Expected: ${expectedHash}, Got: ${actualHash}`,
    );
  }

  return normalizedOutputPath;
}
