import * as bindings from "@ckb-js-std/bindings";
import { HighLevel, log } from "@ckb-js-std/core";
import { PackageDataCodec } from "./type";
import { decodeBytes20ToUtf8, isCellPresent } from "./util";
import { isValidSemver, compareSemver } from "./semver";

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
  log.debug(`package name: ${decodeBytes20ToUtf8(packageData.name)}`);
  log.debug(`package version: ${decodeBytes20ToUtf8(packageData.version)}`);
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

  // 4. check package name and version
  const outputVersion = decodeBytes20ToUtf8(packageData.version);
  if (!isValidSemver(outputVersion)) {
    log.error(`package version is not valid semver: ${outputVersion}`);
    return 3;
  }

  if (isCellPresent(0, bindings.SOURCE_GROUP_INPUT)) {
    const inputData = HighLevel.loadCellData(0, HighLevel.SOURCE_GROUP_INPUT);
    const inputPackageData = PackageDataCodec.decode(inputData);

    // 4.1 check the package name: name should not be changed after created
    if (inputPackageData.name !== packageData.name) {
      log.error(
        `package name cannot be changed: ${decodeBytes20ToUtf8(inputPackageData.name)} -> ${decodeBytes20ToUtf8(packageData.name)}`,
      );
      return 2;
    }

    // 4.2 check package version: should follow semver and be greater than the previous version
    const inputVersion = decodeBytes20ToUtf8(inputPackageData.version);
    if (!isValidSemver(inputVersion)) {
      log.error(
        `previous package version is not valid semver: ${inputVersion}`,
      );
      return 4;
    }
    if (compareSemver(outputVersion, inputVersion) <= 0) {
      log.error(
        `package version must be greater than previous version: ${inputVersion} -> ${outputVersion}`,
      );
      return 5;
    }
  }
  return 0;
}

bindings.exit(main());
