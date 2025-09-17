import { bundlePackage, unbundlePackage } from "../sdk/bundle";
import { chunkFile, mergeChunks } from "../sdk/chunk";

describe("package contract", () => {
  test("should execute successfully", async () => {
    const input = "~/Desktop/offckb-placeholder";
    const output = "~/Desktop/npm5";
    const tgzPath = await bundlePackage(input, output);

    await unbundlePackage(tgzPath, output);
  });
});

describe("file chunking", () => {
  test("should chunk and merge file successfully", async () => {
    const input = "~/Desktop/offckb-placeholder";
    const output = "~/Desktop/npm5";
    const tgzPath = await bundlePackage(input, output);
    const chunkDir = `${output}/chunks`;
    const mergedPath = `${output}/merged.tgz`;

    // Chunk the file
    const { chunks, hash } = await chunkFile(tgzPath, chunkDir, 500 * 1024); // 500KB chunks for faster testing

    // Verify chunks were created
    expect(chunks.length).toBeGreaterThan(0);
    chunks.forEach((chunk) => {
      expect(chunk.path).toBeDefined();
      expect(chunk.hash).toBeDefined();
      expect(chunk.hash.length).toBe(64); // SHA256 hex length
    });
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // SHA256 hex length

    // Merge the chunks back
    const resultPath = await mergeChunks(chunks, hash, mergedPath);

    // Verify the merged file exists and has the same size
    const fs = await import("fs");
    const originalStats = await fs.promises.stat(tgzPath);
    const mergedStats = await fs.promises.stat(resultPath);
    expect(mergedStats.size).toBe(originalStats.size);
  }, 10000); // 10 second timeout
});
