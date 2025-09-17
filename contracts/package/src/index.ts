import * as bindings from "@ckb-js-std/bindings";
import { Script, HighLevel, log } from "@ckb-js-std/core";

function main(): number {
  log.setLevel(log.LogLevel.Debug);
  let script = bindings.loadScript();
  log.debug(`package script loaded: ${JSON.stringify(script)}`);

  // This script defines the metadata for the library package in the data of the cell.
  // The args is the type id.
  // the actual code is stored in other cells by locating them with the code-hash

  return 0;
}

bindings.exit(main());
