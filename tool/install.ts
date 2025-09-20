import path from "path";
import fs from "fs";
import { readDependencies } from "./util";
import { add, addViaNpm } from "./add";

export async function install(
  packageJsonFilePath: string,
  options: { network: string },
) {
  if (!fs.existsSync(packageJsonFilePath)) {
    throw new Error("package.json Path does not exits.");
  }

  const targetFolder = path.dirname(packageJsonFilePath);
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonFilePath, "utf8"));
  // install the deps of the dep too
  const dependencies = await readDependencies(packageJson);
  console.log(
    `Ready to install dependencies: ${JSON.stringify(dependencies, null, 2)}`,
  );
  for (const dep of dependencies.sort((a, b) => (a.isNpm5 ? -1 : 1))) {
    if (dep.isNpm5) {
      await add(dep.typeHash, options, targetFolder);
    } else {
      addViaNpm(dep.name, dep.version, targetFolder);
    }
  }
}
