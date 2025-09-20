import { ccc, hashCkb, hashTypeToBytes, hexFrom } from "@ckb-ccc/core";
import { PackageContract } from "../sdk/contract";
import { buildClient } from "../sdk/ccc";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "child_process";
import systemScripts from "../deployment/system-scripts.json";
import scripts from "../deployment/scripts.json";
import { readDependencies } from "./util";

export async function add(
  typeHash: string,
  options: { network: string },
  targetFolder: string,
) {
  try {
    // Validate typeHash is 32 bytes (64 hex chars + 0x)
    if (!/^0x[0-9a-fA-F]{64}$/.test(typeHash)) {
      throw new Error(
        "Type hash must be a 32-byte hex string (0x followed by 64 hex characters)",
      );
    }
    // validate network
    if (!["devnet", "testnet", "mainnet"].includes(options.network)) {
      throw new Error("Network must be one of: devnet, testnet, mainnet");
    }

    const network = options.network as "devnet" | "testnet" | "mainnet";
    console.log(`Using network: ${network}`);

    const client = buildClient(network);
    // @ts-ignore
    const contractScript = scripts[network]["package.bc"];
    const argsPrefix =
      "0x0000" +
      contractScript.codeHash.slice(2) +
      hexFrom(hashTypeToBytes(contractScript.hashType)).slice(2);

    // Search for cells with type script prefix
    const cells = client.findCells({
      script: {
        // @ts-ignore
        codeHash: systemScripts[network]["ckb_js_vm"].script.codeHash,
        // @ts-ignore
        hashType: systemScripts[network]["ckb_js_vm"].script.hashType,
        args: argsPrefix,
      },
      scriptType: "type",
      scriptSearchMode: "prefix",
    });

    let foundCell: ccc.Cell | null = null;
    for await (const cell of cells) {
      // Compute the script hash
      const scriptHash = cell.cellOutput.type!.hash();
      if (scriptHash === typeHash) {
        foundCell = cell;
        break;
      }
    }

    if (!foundCell) {
      throw new Error(`No cells found with type script hash ${typeHash}`);
    }

    const outpoint = {
      txHash: foundCell.outPoint.txHash,
      index: ccc.numToHex(foundCell.outPoint.index),
    };
    console.log(`Found package cell: ${outpoint.txHash}:${outpoint.index}`);

    // Download to node_modules
    const nodeModulesPath = path.resolve(targetFolder, "node_modules");
    const downloadPath = await PackageContract.downloadPackage(
      outpoint,
      nodeModulesPath,
      client,
    );
    console.log(`Downloaded package to: ${downloadPath}`);

    // Read the package.json from the downloaded package
    const packageJsonPath = path.join(downloadPath, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error("Downloaded package does not contain a package.json");
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    // install the deps of the dep too
    const dependencies = await readDependencies(packageJson);
    for (const dep of dependencies) {
      if (dep.isNpm5) {
        await add(dep.typeHash, options, targetFolder);
      } else {
        addViaNpm(dep.name, dep.version, targetFolder);
      }
    }

    const packageName = packageJson.name;
    const packageVersion = packageJson.version;
    if (!packageName || !packageVersion) {
      throw new Error("Package name or version not found in package.json");
    }
    const version = `${packageVersion}/typeHash:${typeHash}`;
    console.log(
      `Package: ${packageName}@${version}, dataHash:${hashCkb(foundCell.outputData)}`,
    );

    // Update package.json deps
    const rootPackageJsonPath = path.resolve(targetFolder, "./package.json");
    const rootPackageJson = JSON.parse(
      fs.readFileSync(rootPackageJsonPath, "utf8"),
    );

    if (!rootPackageJson.dependencies) {
      rootPackageJson.dependencies = {};
    }

    rootPackageJson.dependencies[packageName] = version;

    fs.writeFileSync(
      rootPackageJsonPath,
      JSON.stringify(rootPackageJson, null, 2),
    );

    console.log(`Added ${packageName}@${version} to dependencies`);

    // todo: update package-lock.json, pnpm-lock.json or yarn.lock accordingly
    // or maybe we just create a npm5-lock.json to manage the packages installed by npm5
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

export function addViaNpm(
  packageName: string,
  version: string,
  targetFolder: string,
) {
  execSync(`npm add ${packageName}@${version}`, {
    cwd: targetFolder,
    stdio: "inherit",
  });
}
