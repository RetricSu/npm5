import * as bindings from "@ckb-js-std/bindings";
import { HighLevel, log } from "@ckb-js-std/core";
import { PackageDataCodec } from "./type";

function main(): number {
  log.setLevel(log.LogLevel.Debug);
  // This script defines the metadata for the library package in the data of the cell.
  // The args is the type id.
  // the actual code is stored in other cells by locating them with the code-hash

  // 1. check type id
  HighLevel.checkTypeId(35);

  const data = HighLevel.loadCellData(0, HighLevel.SOURCE_GROUP_OUTPUT);
  const packageData = PackageDataCodec.decode(data);
  log.debug(`package data: ${JSON.stringify(packageData)}`);

  // 2. check cellDeps code hash matches with the chunk hash for data availability
  for (const chunk of packageData.chunks) {
    const idx = +chunk.index;
    log.debug(`checking chunk index: ${idx}`);

    let found = HighLevel.findCellByDataHash(
      bindings.hex.decode(chunk.hash),
      HighLevel.SOURCE_CELL_DEP,
    );
    if (found === null) {
      log.error(`chunk with hash ${chunk.hash} not found in cell deps`);
      return 1;
    } else {
      log.debug(`found chunk ${idx} in cell deps ${found}`);
    }
  }

  // 3. check the data integrity
  // todo: we can't check the full file hash since loading all the chunks and concat them might overflow the memory
  // Instead, we can compute a merkle root hash from the chunk hashes and validate it here.
  // For now we just do nothing with the hash

  // 4. check the package name and version
  // todo: name should not be changed after created
  // version should follow semver
  // For now, we just do nothing
  return 0;
}

bindings.exit(main());
