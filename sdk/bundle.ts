import fs from "fs";
import path from "node:path";
import { normalizePath } from "./util";

const tar = require("tar");
// const Arborist = require("@npmcli/arborist");
// const packlist = require("npm-packlist");

// Simple file listing function to replace Arborist + packlist
async function getPackageFiles(pkgRoot: string): Promise<string[]> {
  const files: string[] = [];
  const ignorePatterns = [
    'node_modules',
    '.git',
    '.DS_Store',
    '*.log',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
    '.npm',
    '.cache'
  ];

  function shouldIgnore(filePath: string): boolean {
    const fileName = path.basename(filePath);
    return ignorePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(fileName);
      }
      return fileName === pattern || filePath.includes(`/${pattern}/`) || filePath.startsWith(`${pattern}/`);
    });
  }

  function walk(dir: string, relativePath: string = ''): void {
    const items = fs.readdirSync(path.join(pkgRoot, dir));
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativeItemPath = relativePath ? path.join(relativePath, item) : item;

      if (shouldIgnore(relativeItemPath)) continue;

      const stat = fs.statSync(path.join(pkgRoot, fullPath));
      if (stat.isDirectory()) {
        walk(fullPath, relativeItemPath);
      } else {
        files.push(relativeItemPath);
      }
    }
  }

  walk('.');
  return files;
}

export interface BundleResult {
  zipFilePath: string;
  name: string;
  version: string;
}

export async function bundlePackage(
  packageFolderPath: string,
  outputDir?: string,
): Promise<BundleResult> {
  const pkgRoot = normalizePath(packageFolderPath); // 要发布的目录
  const pkgJson = JSON.parse(
    fs.readFileSync(`${pkgRoot}/package.json`, "utf8"),
  );

  // 1. Get file list (simplified version without Arborist)
  const files = await getPackageFiles(pkgRoot);

  // 2. 把列表打成 tar → gzip
  const tgzName = `${pkgJson.name}-${pkgJson.version}.tgz`;
  const outputDirectory = outputDir ? normalizePath(outputDir) : pkgRoot;
  const fullPath = path.join(outputDirectory, tgzName);
  // Ensure output directory exists
  await fs.promises.mkdir(outputDirectory, { recursive: true });
  await tar.create(
    {
      file: fullPath,
      cwd: pkgRoot,
      gzip: true,
      portable: true,
      prefix: pkgJson.name, // Use package name as prefix to mimic npm behavior
    },
    files,
  );

  return {
    zipFilePath: fullPath,
    name: pkgJson.name,
    version: pkgJson.version,
  };
}

export async function unbundlePackage(
  tgzFile: string,
  outputDir?: string,
): Promise<void> {
  // Ensure output directory exists
  const outputDirectory = outputDir ? normalizePath(outputDir) : process.cwd();
  await fs.promises.mkdir(outputDirectory, { recursive: true });

  await tar.extract({
    file: normalizePath(tgzFile),
    cwd: outputDirectory,
    gzip: true,
  });
}
