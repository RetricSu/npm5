import { Hex } from "@ckb-ccc/core";
import { PackageContract } from "../sdk/contract";
import { buildClient, buildSigner } from "../sdk/ccc";
import process from "node:process";

export async function publishPackage(
  packageFolder: string,
  options: { network: string; output?: string; privateKey: Hex },
) {
  try {
    // validate network
    if (!["devnet", "testnet", "mainnet"].includes(options.network)) {
      throw new Error("Network must be one of: devnet, testnet, mainnet");
    }

    const network = options.network as "devnet" | "testnet" | "mainnet";
    const outputDir = options.output;
    console.log(`Publishing package from: ${packageFolder}`);
    console.log(`Using network: ${network}`);
    if (outputDir) {
      console.log(`Output directory: ${outputDir}`);
    } else {
      console.log(`Output directory: (using temp directory)`);
    }

    const client = buildClient(network);
    const signer = buildSigner(client, options.privateKey);

    const contract = await PackageContract.buildFromPublishingChunkCells(
      packageFolder,
      signer,
      outputDir,
    );
    const tx = await contract.buildCreatePackageCellTransaction(
      signer,
      network,
    );
    await tx.completeFeeBy(signer, 1000);
    const txHash = await signer.sendTransaction(tx);
    console.log(`Transaction sent: ${txHash}`);

    // Wait for the transaction to be committed
    await signer.client.waitTransaction(txHash, 1);
    console.log(`Package published at ${txHash}:0x0`);
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}
