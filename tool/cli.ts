#!/usr/bin/env node

import { Command } from "commander";
import process from "node:process";
import { add } from "./add";
import { publishPackage } from "./publish";
import { install } from "./install";
import path from "node:path";

const program = new Command();

program.name("npm5").description("CKB package manager").version("0.1.0");

program
  .command("add <typeHash>")
  .description("Add a package by its type script hash")
  .option("-n, --network <network>", "CKB network", "devnet")
  .action(async (typeHash: string, options: { network: string }) => {
    const targetPath = process.cwd();
    return await add(typeHash, options, targetPath);
  });

program
  .command("publish <packageFolder>")
  .description("Publish a package to the CKB network")
  .option("-k, --private-key <privateKey>", "Private key in hex format")
  .option("-n, --network <network>", "CKB network", "devnet")
  .action(async (packageFolder: string, options) => {
    return await publishPackage(packageFolder, options);
  });

program
  .command("install [packageJsonFilePath]")
  .alias("i")
  .description("Install packages listed in package.json")
  .option("-n, --network <network>", "CKB network", "devnet")
  .action(
    async (
      packageJsonFilePath: string | undefined,
      options: { network: string },
    ) => {
      const filePath =
        packageJsonFilePath ?? path.resolve(process.cwd(), "package.json");
      return await install(filePath, options);
    },
  );

program.parse();
