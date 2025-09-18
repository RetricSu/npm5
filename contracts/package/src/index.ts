import * as bindings from "@ckb-js-std/bindings";
import { hashCkb, HighLevel, log } from "@ckb-js-std/core";
import { PackageDataCodec } from "./type";

function main(): number {
  log.setLevel(log.LogLevel.Debug);
  // This script defines the metadata for the library package in the data of the cell.
  // The args is the type id.
  // the actual code is stored in other cells by locating them with the code-hash

  HighLevel.checkTypeId(35);

  const data = HighLevel.loadCellData(0, HighLevel.SOURCE_GROUP_OUTPUT);
  const packageData = PackageDataCodec.decode(data);
  log.debug(`package data: ${JSON.stringify(packageData)}`);

  const transaction = HighLevel.loadTransaction();
  const cellDepsLength = transaction.cellDeps.length;

  // check cellDeps code hash matches with the chunk hash
  for (const chunk of packageData.chunks) {
    const idx = +chunk.index;
    log.debug(`checking chunk index: ${idx}`);

    // iterate all cell deps to find the matching one
    let found = false;
    for (let i = 0; i < cellDepsLength; i++) {
      try {
        const depCellData = HighLevel.loadCellData(
          i,
          HighLevel.SOURCE_CELL_DEP,
        );
        if (depCellData) {
          const hash = bindings.hex.encode(hashCkb(depCellData)).slice(0, 40); // first 20 bytes
          log.debug(`calculated chunk hash: ${hash} for cell dep ${i}`);
          if (hash === chunk.hash) {
            found = true;
            log.debug(
              `found matching chunk hash: ${hash} for index ${chunk.index} in cell dep index ${i}`,
            );
            break;
          }
        }
      } catch (error) {
        log.debug(
          `failed to load cell data for index ${i}: ${(error as Error).message}, skipping...`,
        );
      }
    }
    if (!found) {
      log.error(
        `no matching chunk hash: ${chunk.hash} for index ${chunk.index} found in cell deps`,
      );
      return 1;
    }
  }

  // todo: check full file hash

  return 0;
}

bindings.exit(main());
