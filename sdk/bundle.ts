import packlist from "npm-packlist";
import fs from "fs";
import path from "node:path";
import { normalizePath } from "./util";

const tar = require("tar");
const Arborist = require("@npmcli/arborist");

export async function bundlePackage(
  packagePath: string,
  outputPath?: string,
): Promise<string> {
  const pkgRoot = normalizePath(packagePath); // 要发布的目录
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
  const outputDir = outputPath ? normalizePath(outputPath) : pkgRoot;
  const fullPath = path.join(outputDir, tgzName);
  await tar.create(
    {
      file: fullPath,
      cwd: pkgRoot,
      gzip: true, // 直接 gzip
      portable: true,
      prefix: "package", // npm 约定顶层文件夹叫 package
    },
    files,
  );

  return fullPath;
}

export async function unbundlePackage(
  tgzPath: string,
  outputPath?: string,
): Promise<string> {
  const outputDir = outputPath ? normalizePath(outputPath) : process.cwd();
  await tar.extract({
    file: normalizePath(tgzPath),
    cwd: outputDir,
    gzip: true,
  });
  // The extracted content will be in a 'package' subdirectory due to the prefix
  return path.join(outputDir, "package");
}
