# npm5

> Code is common knowledge!

A decentralized js package manager built on the CKB blockchain. npm5 enables developers to easily discover, install, and manage js libraries across CKB networks.

```sh
npm5 add 0x4e3d74baecad1fd3517c88e9f91ac202fdc46635970f8cdd3c20eb842ceef56e

#result
Using network: devnet
Found package cell: 0x2f76e4dd74bcd35254320f1e8f815962a93e422718bc29a8e438bc9dd93bad31:0x0
Package data: {"name":"0x636b622d74657374746f6f6c0000000000000000","version":"0x312e302e33000000000000000000000000000000","hash":"0x1cdd4ee0bcf7565d4d84f33ec370ae2b53b6f0b8","chunks":[{"hash":"0xa19f5c46cad8bdc9cf72ede88a86cc4bb8ed508a0e421eba08bc59fea5c65586","index":0},{"hash":"0x46fd4467cc6f96b26e890953c91d46ae06198ebe390c02834fd9cfe6d0cc3075","index":1},{"hash":"0x4ee171454dedc0f4ca6395253cd303e37d77eea892677ee4773f294e709e0e95","index":2},{"hash":"0x0e2e113bb9bde6bb0fdc584d1adb8480a8582782ff1e8eb10c25c393f71d6f87","index":3},{"hash":"0x94912929aa60917851261af342835bf8d72e74555ca5fb2cbb29ca65642c3ff7","index":4}]}
Downloaded package: ckb-testtool@1.0.3
Downloaded package to: /Users/retric/Desktop/npm5/node_modules/ckb-testtool
Package: ckb-testtool@1.0.3/dataHash:0x18518a43f308f499c56a18686b2ebafc3e42599065b1352ef82b3c5b66e0d582
Added ckb-testtool@1.0.3 to dependencies
```

## 🎯 What Makes npm5 Special

Unlike traditional package managers that rely on centralized registries, npm5 operates entirely on-chain:

- **On-Chain Registry**: Packages are stored and discovered directly on the CKB blockchain
- **Decentralized Verification**: Package integrity is verified through blockchain consensus
- **Type Hash Based**: Packages are identified by their CKB type script hashes

## Overview

This project uses the CKB JavaScript VM (ckb-js-vm) to write smart contracts in TypeScript. The contracts are compiled to bytecode and can be deployed to the CKB blockchain. npm5 provides the tooling to manage these contracts as reusable packages that other developers can easily install and use in their projects.

## Project Structure

```text
npm5/
├── contracts/           # Smart contract source code
│   └── package/
│       └── src/
│           └── index.typescript # Contract implementation
├── tests/              # Contract tests
│   └── package.test.typescript
├── scripts/            # Build and utility scripts
│   ├── build-all.js
│   ├── build-contract.js
│   └── add-contract.js
├── dist/               # Compiled output (generated)
│   ├── package.js  # Bundled JavaScript
│   └── package.bc  # Compiled bytecode
├── package.json
├── tsconfig.json       # TypeScript configuration
├── tsconfig.base.json  # Base TypeScript settings
├── jest.config.cjs     # Jest testing configuration
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- pnpm package manager

### Installation

1. Install dependencies:

   ```bash
   pnpm install
   ```

### CLI Setup

To use the `npm5` CLI globally for package management:

1. Build the CLI:

   ```bash
   pnpm run build:cli
   ```

2. Link the CLI globally:

   ```bash
   npm link
   ```

3. Verify installation:

   ```bash
   npm5 --version
   npm5 --help
   ```

Now you can use `npm5` commands from anywhere:

```bash
# Add a package by type hash
npm5 add 0x4e3d74baecad1fd3517c88e9f91ac202fdc46635970f8cdd3c20eb842ceef56e

# Show help
npm5 --help
```

**Note**: The CLI requires ES modules (`"type": "module"` in package.json). If you encounter module-related errors, ensure you're using Node.js v20+ and the CLI has been built with the correct configuration.

### Building Contracts

Build all contracts:

```bash
pnpm run build
```

Build a specific contract:

```bash
pnpm run build:contract package
```

### Running Tests

Run all tests:

```bash
pnpm test
```

Run tests for a specific contract:

```bash
pnpm test -- package
```

### Adding New Contracts

Create a new contract:

```bash
pnpm run add-contract my-new-contract
```

This will:

- Create a new contract directory under `contracts/`
- Generate a basic contract template
- Create a corresponding test file

## Development

### Contract Development

1. Edit your contract in `contracts/<contract-name>/src/index.typescript`
2. Build the contract: `pnpm run build:contract <contract-name>`
3. Run tests: `pnpm test -- <contract-name>`

### Build Output

All contracts are built to the global `dist/` directory:

- `dist/{contract-name}.js` - Bundled JavaScript code
- `dist/{contract-name}.bc` - Compiled bytecode for CKB execution

### Testing

Tests use the `ckb-testtool` framework to simulate CKB blockchain execution. Each test:

1. Sets up a mock CKB environment
2. Deploys the contract bytecode
3. Executes transactions
4. Verifies results

## Available Scripts

- `build` - Build all contracts
- `build:contract <name>` - Build a specific contract
- `test` - Run all tests
- `add-contract <name>` - Add a new contract
- `deploy` - Deploy contracts to CKB network
- `clean` - Remove all build outputs
- `format` - Format code with Prettier

## Deployment

Deploy your contracts to CKB networks using the built-in deploy script:

### Basic Usage

```bash
# Deploy to devnet (default)
pnpm run deploy

# Deploy to testnet
pnpm run deploy -- --network testnet

# Deploy to mainnet
pnpm run deploy -- --network mainnet
```

### Advanced Options

```bash
# Deploy with upgradable type ID
pnpm run deploy -- --network testnet --type-id

# Deploy with custom private key
pnpm run deploy -- --network testnet --privkey 0x...

# Combine multiple options
pnpm run deploy -- --network testnet --type-id --privkey 0x...
```

### Available Options

- `--network <network>` - Target network: `devnet`, `testnet`, or `mainnet` (default: `devnet`)
- `--privkey <privkey>` - Private key for deployment (default: uses offckb's deployer account)
- `--type-id` - Enable upgradable type ID for contract updates

### Deployment Artifacts

After successful deployment, artifacts are saved to the `deployment/` directory:

- `deployment/scripts.json` - Contract script information
- `deployment/<network>/<contract>/deployment.toml` - Deployment configuration
- `deployment/<network>/<contract>/migrations/` - Migration history

## Dependencies

### Core Dependencies

- `@ckb-js-std/bindings` - CKB JavaScript VM bindings
- `@ckb-js-std/core` - Core CKB JavaScript utilities

### Development Dependencies

- `ckb-testtool` - Testing framework for CKB contracts
- `esbuild` - Fast JavaScript bundler
- `jest` - JavaScript testing framework
- `typescript` - TypeScript compiler
- `ts-jest` - TypeScript support for Jest
- `prettier` - Code formatter

## Resources

- [CKB JavaScript VM Documentation](https://github.com/nervosnetwork/ckb-js-vm)
- [CKB Developer Documentation](https://docs.nervos.org/docs/script/js/js-quick-start)
- [The Little Book of ckb-js-vm](https://nervosnetwork.github.io/ckb-js-vm/)

## License

MIT
