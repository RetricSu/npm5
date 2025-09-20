import { ccc } from "@ckb-ccc/core";
import { compareFileTrees } from "../sdk/util";
import { buildClient, buildSigner } from "../sdk/ccc";
import { PackageContract } from "../sdk/contract";

describe("package contract devnet", () => {
  let client: ccc.Client;
  let signer: ccc.SignerCkbPrivateKey;

  beforeAll(() => {
    // Create global devnet client and signer for all tests in this describe block
    client = buildClient("devnet");
    signer = buildSigner(client);
  });

  test("Package Contract Class", async () => {
    const packageFolder = "./node_modules/ckb-testtool";
    const outputDir = "./test-package";
    const contract = await PackageContract.buildFromPublishingChunkCells(
      packageFolder,
      signer,
      outputDir,
    );
    const tx = await contract.buildCreatePackageCellTransaction(signer);
    await tx.completeFeeBy(signer, 1000);
    const txHash = await signer.sendTransaction(tx);
    console.log(`Transaction sent: ${txHash}`);

    // we must wait for the transaction to be committed before we can download the package
    // since ccc has cache for chained tx
    await signer.client.waitTransaction(txHash, 1);

    const downloadedPackage = await PackageContract.downloadPackage(
      { txHash, index: "0x0" },
      outputDir,
      client,
    );
    expect(downloadedPackage).toBeDefined();

    // Verify that the downloaded package has the same file tree as the original
    const fileTreesMatch = compareFileTrees(packageFolder, downloadedPackage);
    expect(fileTreesMatch).toBe(true);
  }, 60000);

  test("Package Contract Class - using temp directory", async () => {
    const packageFolder = "./node_modules/ckb-testtool";
    // Test without providing outputDir - should use temp directory internally
    const contract = await PackageContract.buildFromPublishingChunkCells(
      packageFolder,
      signer,
    );
    expect(contract).toBeDefined();
    // Verify we can build a transaction with the contract
    const tx = await contract.buildCreatePackageCellTransaction(signer);
    expect(tx).toBeDefined();
  }, 60000);
});
