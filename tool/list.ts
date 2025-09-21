import systemScripts from "../deployment/system-scripts.json";
import scripts from "../deployment/scripts.json";
import { hexFrom, hashTypeToBytes, ccc } from "@ckb-ccc/core";
import { decodeBytes20ToUtf8, PackageDataCodec } from "../sdk/type";
import { buildClient } from "../sdk/ccc";

export async function listAvailablePackages(
  network: "devnet" | "testnet" | "mainnet",
) {
  // @ts-ignore
  const contractScript = scripts[network]["package.bc"];
  const argsPrefix =
    "0x0000" +
    contractScript.codeHash.slice(2) +
    hexFrom(hashTypeToBytes(contractScript.hashType)).slice(2);

  const client = buildClient(network);
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

  for await (const cell of cells) {
    // Compute the script hash
    const data = cell.outputData;
    const packageData = PackageDataCodec.decode(data);
    const name = decodeBytes20ToUtf8(packageData.name);
    const version = decodeBytes20ToUtf8(packageData.version);
    packageData.name = name;
    packageData.version = version;

    console.log(`${packageData.name}@${packageData.version}`);
    console.log(`  TypeHash: ${cell.cellOutput.type!.hash()}`);
    console.log(
      `  Outpoint: ${cell.outPoint.txHash}:${ccc.numToHex(cell.outPoint.index)}`,
    );
    console.log(`  Controlled By Lock Hash: ${cell.cellOutput.lock.hash()}`);
    console.log("--------------------------------------------------");
  }
}
