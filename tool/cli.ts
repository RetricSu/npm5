#!/usr/bin/env node

import { Command } from "commander";
import { ccc, hashTypeToBytes, hexFrom } from "@ckb-ccc/core";
import { PackageContract } from "../sdk/contract.js";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import systemScripts from "../deployment/system-scripts.json";
import scripts from "../deployment/scripts.json";

const program = new Command();

program.name("npm5").description("CKB package manager").version("0.1.0");

program
  .command("add <typeHash>")
  .description("Add a package by its type script hash")
  .action(async (typeHash: string) => {
    try {
      // Validate typeHash is 32 bytes (64 hex chars + 0x)
      if (!/^0x[0-9a-fA-F]{64}$/.test(typeHash)) {
        throw new Error(
          "Type hash must be a 32-byte hex string (0x followed by 64 hex characters)",
        );
      }

      // Create client - default to devnet
      const client = new ccc.ClientPublicTestnet();

      const contractScript = scripts.devnet["package.bc"];
      const argsPrefix = "0x0000" + contractScript.codeHash.slice(2) + hexFrom(hashTypeToBytes(contractScript.hashType)).slice(2);

      // Search for cells with type script prefix
      const cells = client.findCells({
        script: {
          codeHash: systemScripts.devnet["ckb_js_vm"].script.codeHash,
          hashType: systemScripts.devnet["ckb_js_vm"].script.hashType,
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
      const nodeModulesPath = path.resolve(process.cwd(), "node_modules");
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
      const packageName = packageJson.name;
      const packageVersion = packageJson.version;

      if (!packageName || !packageVersion) {
        throw new Error("Package name or version not found in package.json");
      }

      console.log(`Package: ${packageName}@${packageVersion}`);

      // Update package.json deps
      const rootPackageJsonPath = path.resolve(__dirname, "../../package.json");
      const rootPackageJson = JSON.parse(
        fs.readFileSync(rootPackageJsonPath, "utf8"),
      );

      if (!rootPackageJson.dependencies) {
        rootPackageJson.dependencies = {};
      }

      rootPackageJson.dependencies[packageName] = packageVersion;

      fs.writeFileSync(
        rootPackageJsonPath,
        JSON.stringify(rootPackageJson, null, 2),
      );

      console.log(`Added ${packageName}@${packageVersion} to dependencies`);
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  });

program.parse();
