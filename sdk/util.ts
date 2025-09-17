import os from "os";
import path from "path";

/**
 * Normalizes a path to an absolute path, resolving relative paths and expanding ~.
 */
export function normalizePath(p: string): string {
  if (p.startsWith("~")) {
    p = p.replace(/^~/, os.homedir());
  }
  return path.resolve(p);
}
