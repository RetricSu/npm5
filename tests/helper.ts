import { ccc, CellDepInfoLike, KnownScript, Script } from "@ckb-ccc/core";
import systemScripts from "../deployment/system-scripts.json";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

export const buildSigner = (client: ccc.Client) => {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "PRIVATE_KEY is not set in environment variables or .env file",
    );
  }
  const signer = new ccc.SignerCkbPrivateKey(client, privateKey);
  return signer;
};

export const buildClient = (network: "devnet" | "testnet" | "mainnet") => {
  switch (network) {
    case "devnet":
      return new ccc.ClientPublicTestnet({
        url: "http://127.0.0.1:28114", // the proxy RPC from offckb devnet
        scripts: DEVNET_SCRIPTS,
        fallbacks: ["http://127.0.0.1:8114"], // use non-proxy RPC for fallbacks if proxy server has trouble
      });
    case "testnet":
      return new ccc.ClientPublicTestnet({
        url: "http://127.0.0.1:38114", // proxy RPC from offckb, make sure you start the testnet node by running: `offckb node --network testnet`
        fallbacks: ["https://testnet.ckb.dev"], // use non-proxy RPC for fallbacks if proxy server has trouble
      });
    case "mainnet":
      return new ccc.ClientPublicMainnet({
        url: "http://127.0.0.1:48114", // proxy RPC from offckb, make sure you start the mainnet node by running: `offckb node --network mainnet`
        fallbacks: ["https://mainnet.ckb.dev"], // use non-proxy RPC for fallbacks if proxy server has trouble
      });

    default:
      throw new Error(`Unsupported network: ${network}`);
  }
};

export type KnownScriptType = Pick<Script, "codeHash" | "hashType"> & {
  cellDeps: CellDepInfoLike[];
};

export const DEVNET_SCRIPTS: Record<string, KnownScriptType> = {
  [KnownScript.Secp256k1Blake160]: systemScripts.devnet
    .secp256k1_blake160_sighash_all!.script as KnownScriptType,
  [KnownScript.Secp256k1Multisig]: systemScripts.devnet
    .secp256k1_blake160_multisig_all!.script as KnownScriptType,
  [KnownScript.NervosDao]: systemScripts.devnet.dao!.script as KnownScriptType,
  [KnownScript.AnyoneCanPay]: systemScripts.devnet.anyone_can_pay!
    .script as KnownScriptType,
  [KnownScript.OmniLock]: systemScripts.devnet.omnilock!
    .script as KnownScriptType,
  [KnownScript.XUdt]: systemScripts.devnet.xudt!.script as KnownScriptType,
};

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
