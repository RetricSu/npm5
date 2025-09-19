import os from "os";
import path from "path";
import fs from "fs";

/**
 * Normalizes a path to an absolute path, resolving relative paths and expanding ~.
 */
export function normalizePath(p: string): string {
  if (p.startsWith("~")) {
    p = p.replace(/^~/, os.homedir());
  }
  return path.resolve(p);
}

// Helper function to get all files in a directory recursively
export function getAllFiles(
  dirPath: string,
  basePath: string = dirPath,
): string[] {
  const files: string[] = [];

  function traverse(currentPath: string) {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and other common directories
        if (
          item !== "node_modules" &&
          item !== ".git" &&
          !item.startsWith(".")
        ) {
          traverse(fullPath);
        }
      } else if (stat.isFile()) {
        // Get relative path from base directory
        const relativePath = path.relative(basePath, fullPath);
        files.push(relativePath);
      }
    }
  }

  traverse(dirPath);
  return files.sort();
}

// Helper function to compare file trees
export function compareFileTrees(
  originalDir: string,
  downloadedDir: string,
): boolean {
  const originalFiles = getAllFiles(originalDir);
  const downloadedFiles = getAllFiles(downloadedDir);

  // Check if we have the same number of files
  if (originalFiles.length !== downloadedFiles.length) {
    console.log(
      `File count mismatch: ${originalFiles.length} vs ${downloadedFiles.length}`,
    );
    return false;
  }

  // Check if all files exist in both directories
  for (let i = 0; i < originalFiles.length; i++) {
    if (originalFiles[i] !== downloadedFiles[i]) {
      console.log(
        `File mismatch: ${originalFiles[i]} vs ${downloadedFiles[i]}`,
      );
      return false;
    }

    // Optionally check file sizes (basic content verification)
    const originalFilePath = path.join(originalDir, originalFiles[i]);
    const downloadedFilePath = path.join(downloadedDir, downloadedFiles[i]);

    try {
      const originalSize = fs.statSync(originalFilePath).size;
      const downloadedSize = fs.statSync(downloadedFilePath).size;

      if (originalSize !== downloadedSize) {
        console.log(
          `File size mismatch for ${originalFiles[i]}: ${originalSize} vs ${downloadedSize}`,
        );
        return false;
      }
    } catch (error) {
      console.log(
        `Error checking file sizes for ${originalFiles[i]}: ${error}`,
      );
      return false;
    }
  }

  return true;
}
