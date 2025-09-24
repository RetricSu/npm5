let imports = {};
imports["__wbindgen_placeholder__"] = module.exports;
let wasm;
const { TextEncoder, TextDecoder } = require(`util`);

function logError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    let error = (function () {
      try {
        return e instanceof Error
          ? `${e.message}\n\nStack:\n${e.stack}`
          : e.toString();
      } catch (_) {
        return "<failed to stringify thrown value>";
      }
    })();
    console.error(
      "wasm-bindgen: imported JS function that was not marked as `catch` threw an error:",
      error,
    );
    throw e;
  }
}

function _assertBoolean(n) {
  if (typeof n !== "boolean") {
    throw new Error(`expected a boolean argument, found ${typeof n}`);
  }
}

function _assertNum(n) {
  if (typeof n !== "number")
    throw new Error(`expected a number argument, found ${typeof n}`);
}

function debugString(val) {
  // primitive types
  const type = typeof val;
  if (type == "number" || type == "boolean" || val == null) {
    return `${val}`;
  }
  if (type == "string") {
    return `"${val}"`;
  }
  if (type == "symbol") {
    const description = val.description;
    if (description == null) {
      return "Symbol";
    } else {
      return `Symbol(${description})`;
    }
  }
  if (type == "function") {
    const name = val.name;
    if (typeof name == "string" && name.length > 0) {
      return `Function(${name})`;
    } else {
      return "Function";
    }
  }
  // objects
  if (Array.isArray(val)) {
    const length = val.length;
    let debug = "[";
    if (length > 0) {
      debug += debugString(val[0]);
    }
    for (let i = 1; i < length; i++) {
      debug += ", " + debugString(val[i]);
    }
    debug += "]";
    return debug;
  }
  // Test for built-in
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
  let className;
  if (builtInMatches && builtInMatches.length > 1) {
    className = builtInMatches[1];
  } else {
    // Failed to match the standard '[object ClassName]'
    return toString.call(val);
  }
  if (className == "Object") {
    // we're a user defined class or Object
    // JSON.stringify avoids problems with cycles, and is generally much
    // easier than looping through ownProperties of `val`.
    try {
      return "Object(" + JSON.stringify(val) + ")";
    } catch (_) {
      return "Object";
    }
  }
  // errors
  if (val instanceof Error) {
    return `${val.name}: ${val.message}\n${val.stack}`;
  }
  // TODO we could test for more things here, like `Set`s and `Map`s.
  return className;
}

let WASM_VECTOR_LEN = 0;

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
  if (
    cachedUint8ArrayMemory0 === null ||
    cachedUint8ArrayMemory0.byteLength === 0
  ) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8ArrayMemory0;
}

let cachedTextEncoder = new TextEncoder("utf-8");

const encodeString =
  typeof cachedTextEncoder.encodeInto === "function"
    ? function (arg, view) {
        return cachedTextEncoder.encodeInto(arg, view);
      }
    : function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
          read: arg.length,
          written: buf.length,
        };
      };

function passStringToWasm0(arg, malloc, realloc) {
  if (typeof arg !== "string")
    throw new Error(`expected a string argument, found ${typeof arg}`);

  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr = malloc(buf.length, 1) >>> 0;
    getUint8ArrayMemory0()
      .subarray(ptr, ptr + buf.length)
      .set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr;
  }

  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;

  const mem = getUint8ArrayMemory0();

  let offset = 0;

  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 0x7f) break;
    mem[ptr + offset] = code;
  }

  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, (len = offset + arg.length * 3), 1) >>> 0;
    const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
    const ret = encodeString(arg, view);
    if (ret.read !== arg.length) throw new Error("failed to pass whole string");
    offset += ret.written;
    ptr = realloc(ptr, len, offset, 1) >>> 0;
  }

  WASM_VECTOR_LEN = offset;
  return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
  if (
    cachedDataViewMemory0 === null ||
    cachedDataViewMemory0.buffer.detached === true ||
    (cachedDataViewMemory0.buffer.detached === undefined &&
      cachedDataViewMemory0.buffer !== wasm.memory.buffer)
  ) {
    cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
  }
  return cachedDataViewMemory0;
}

function isLikeNone(x) {
  return x === undefined || x === null;
}

let cachedTextDecoder = new TextDecoder("utf-8", {
  ignoreBOM: true,
  fatal: true,
});

cachedTextDecoder.decode();

function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return cachedTextDecoder.decode(
    getUint8ArrayMemory0().subarray(ptr, ptr + len),
  );
}
/**
 * @param {any} d
 * @returns {Uint8Array}
 */
module.exports.ckb_blake2b_256 = function (d) {
  const ret = wasm.ckb_blake2b_256(d);
  return ret;
};

function addToExternrefTable0(obj) {
  const idx = wasm.__externref_table_alloc();
  wasm.__wbindgen_export_2.set(idx, obj);
  return idx;
}

function passArrayJsValueToWasm0(array, malloc) {
  const ptr = malloc(array.length * 4, 4) >>> 0;
  for (let i = 0; i < array.length; i++) {
    const add = addToExternrefTable0(array[i]);
    getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
  }
  WASM_VECTOR_LEN = array.length;
  return ptr;
}
/**
 * @param {Uint8Array} root
 * @param {Uint8Array} proof
 * @param {Array<any>} leaves
 * @returns {boolean}
 */
module.exports.verify_proof = function (root, proof, leaves) {
  const ret = wasm.verify_proof(root, proof, leaves);
  return ret !== 0;
};

const CkbSmtFinalization =
  typeof FinalizationRegistry === "undefined"
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) => wasm.__wbg_ckbsmt_free(ptr >>> 0, 1));

class CkbSmt {
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    CkbSmtFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_ckbsmt_free(ptr, 0);
  }
  constructor() {
    const ret = wasm.ckbsmt_new();
    this.__wbg_ptr = ret >>> 0;
    CkbSmtFinalization.register(this, this.__wbg_ptr, this);
    return this;
  }
  /**
   * @returns {Uint8Array}
   */
  root() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    _assertNum(this.__wbg_ptr);
    const ret = wasm.ckbsmt_root(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {Uint8Array} key
   * @param {Uint8Array} val
   */
  update(key, val) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    _assertNum(this.__wbg_ptr);
    wasm.ckbsmt_update(this.__wbg_ptr, key, val);
  }
  /**
   * @param {Uint8Array[]} keys
   * @returns {Uint8Array}
   */
  get_proof(keys) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    _assertNum(this.__wbg_ptr);
    const ptr0 = passArrayJsValueToWasm0(keys, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.ckbsmt_get_proof(this.__wbg_ptr, ptr0, len0);
    return ret;
  }
}
module.exports.CkbSmt = CkbSmt;

module.exports.__wbg_buffer_609cc3eee51ed158 = function () {
  return logError(function (arg0) {
    const ret = arg0.buffer;
    return ret;
  }, arguments);
};

module.exports.__wbg_from_2a5d3e218e67aa85 = function () {
  return logError(function (arg0) {
    const ret = Array.from(arg0);
    return ret;
  }, arguments);
};

module.exports.__wbg_get_b9b93047fe3cf45b = function () {
  return logError(function (arg0, arg1) {
    const ret = arg0[arg1 >>> 0];
    return ret;
  }, arguments);
};

module.exports.__wbg_instanceof_Uint8Array_17156bcf118086a9 = function () {
  return logError(function (arg0) {
    let result;
    try {
      result = arg0 instanceof Uint8Array;
    } catch (_) {
      result = false;
    }
    const ret = result;
    _assertBoolean(ret);
    return ret;
  }, arguments);
};

module.exports.__wbg_length_a446193dc22c12f8 = function () {
  return logError(function (arg0) {
    const ret = arg0.length;
    _assertNum(ret);
    return ret;
  }, arguments);
};

module.exports.__wbg_length_e2d2a49132c1b256 = function () {
  return logError(function (arg0) {
    const ret = arg0.length;
    _assertNum(ret);
    return ret;
  }, arguments);
};

module.exports.__wbg_new_a12002a7f91c75be = function () {
  return logError(function (arg0) {
    const ret = new Uint8Array(arg0);
    return ret;
  }, arguments);
};

module.exports.__wbg_newwithbyteoffsetandlength_d97e637ebe145a9a = function () {
  return logError(function (arg0, arg1, arg2) {
    const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
    return ret;
  }, arguments);
};

module.exports.__wbg_set_65595bdd868b3009 = function () {
  return logError(function (arg0, arg1, arg2) {
    arg0.set(arg1, arg2 >>> 0);
  }, arguments);
};

module.exports.__wbindgen_debug_string = function (arg0, arg1) {
  const ret = debugString(arg1);
  const ptr1 = passStringToWasm0(
    ret,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
  getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

module.exports.__wbindgen_init_externref_table = function () {
  const table = wasm.__wbindgen_export_2;
  const offset = table.grow(4);
  table.set(0, undefined);
  table.set(offset + 0, undefined);
  table.set(offset + 1, null);
  table.set(offset + 2, true);
  table.set(offset + 3, false);
};

module.exports.__wbindgen_is_string = function (arg0) {
  const ret = typeof arg0 === "string";
  _assertBoolean(ret);
  return ret;
};

module.exports.__wbindgen_memory = function () {
  const ret = wasm.memory;
  return ret;
};

module.exports.__wbindgen_string_get = function (arg0, arg1) {
  const obj = arg1;
  const ret = typeof obj === "string" ? obj : undefined;
  var ptr1 = isLikeNone(ret)
    ? 0
    : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  var len1 = WASM_VECTOR_LEN;
  getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
  getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

module.exports.__wbindgen_throw = function (arg0, arg1) {
  throw new Error(getStringFromWasm0(arg0, arg1));
};

const path = require("path").join(__dirname, "sparse_merkle_tree_wasm_bg.wasm");
const bytes = require("fs").readFileSync(path);

const wasmModule = new WebAssembly.Module(bytes);
const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
wasm = wasmInstance.exports;
module.exports.__wasm = wasm;

wasm.__wbindgen_start();
