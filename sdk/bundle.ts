import packlist from "npm-packlist";
import fs from "fs";
import path from "node:path";
import { normalizePath } from "./util";

const tar = require("tar");
const Arborist = require("@npmcli/arborist");

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

  // 1. 先得到文件列表（自动尊重 files/.npmignore 等规则）
  const arborist = new Arborist({ path: pkgRoot });
  // @ts-ignore
  const tree = await arborist.loadActual();
  const files = await packlist(tree);

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
): Promise<string> {
  // Ensure output directory exists
  const outputDirectory = outputDir ? normalizePath(outputDir) : process.cwd();
  await fs.promises.mkdir(outputDirectory, { recursive: true });

  await tar.extract({
    file: normalizePath(tgzFile),
    cwd: outputDirectory,
    gzip: true,
  });

  // Find the extracted directory (the one created by the tar prefix)
  const items = fs.readdirSync(outputDirectory, { withFileTypes: true });
  const extractedDirs = items
    .filter((item) => item.isDirectory())
    .map((item) => item.name);

  // Assuming the tar creates one main directory
  if (extractedDirs.length === 1) {
    const fullPath = path.join(outputDirectory, extractedDirs[0]);
    return path.relative(process.cwd(), fullPath);
  } else if (extractedDirs.length > 1) {
    // If multiple, try to find one that looks like a package name
    const packageDir = extractedDirs.find(
      (dir) => !dir.startsWith(".") && dir !== "node_modules",
    );
    const fullPath = packageDir
      ? path.join(outputDirectory, packageDir)
      : path.join(outputDirectory, extractedDirs[0]);
    return path.relative(process.cwd(), fullPath);
  }

  // If no directory, return the outputDir (though unlikely)
  return path.relative(process.cwd(), outputDirectory);
}
