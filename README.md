# npm5

> Code is common knowledge!

A decentralized js package manager built on the CKB blockchain. npm5 enables developers to easily discover, install, and manage js libraries across CKB networks.

## 🎯 What Makes npm5 Special

Unlike traditional package managers that rely on centralized registries, npm5 operates entirely on-chain:

- **On-Chain Registry**: Packages are stored and discovered directly on the CKB blockchain
- **Decentralized Verification**: Package integrity is verified through blockchain consensus
- **Type Hash Based**: Packages are identified by their CKB type script hashes

```sh
npm install -g @retric/npm5
```

Publish the js package to blockchain:

```sh
npm5 publish ./node_modules/@ckb-js-std/bindings --network testnet

# result
Publishing package from: ./node_modules/@ckb-js-std/bindings
Using network: testnet
Output directory: (using temp directory)
ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq2prryvze6fhufxkgjx35psh7w70k3hz7c3mtl4d CKB balance: 22641.18108626 CKB, Package will consume at least: 4647 CKB
Published chunk /var/folders/js/czddptmd75n6_8wxks_4_ytm0000gn/T/npm5-build-1758775173690/chunks/2d2924df0072a00db93139f96685f7ecf52d97837639bc88523dbcf6605d28b9-1.0.0.chunk001 in tx 0x1ebb9c67cd2d67cddf38381912fcbe6aaa61cf735b7bc319949f8e19724038f9
Package Type ID: 0x404dc433140b53ae8456665a5dfdb770a0f9e812c75f9fbaee41d038ba3ff77d, Type Hash: 0x22e1932fa40de75d7c143dc3d9f2a2a4853c9a0c4caf89cb3ac3ce63939c7218
Transaction sent: 0xd2cfc922d0a7f1444009a2c18633e028899d1514185f43bcba248136dab75582
Package published at 0xd2cfc922d0a7f1444009a2c18633e028899d1514185f43bcba248136dab75582:0x0
```

Install the js package via its type hash from blockchain:

```sh
npm5 add 0x22e1932fa40de75d7c143dc3d9f2a2a4853c9a0c4caf89cb3ac3ce63939c7218 --network testnet

# result
Using network: testnet
Found package cell: 0xd2cfc922d0a7f1444009a2c18633e028899d1514185f43bcba248136dab75582:0x0
Package data: {"name":"0x40636b622d6a732d7374642f62696e64696e6773","version":"0x312e302e30000000000000000000000000000000","hash":"0x90cb74d7fef5419bc2896433b6b0b6c58dfdd23b","chunks":[{"hash":"0x90cb74d7fef5419bc2896433b6b0b6c58dfdd23b58eca9648b1cf3c3d8c39e1c","index":0}]}
Downloaded package: @ckb-js-std/bindings@1.0.0
Downloaded package to: /Users/retric/Desktop/npm5/node_modules/@ckb-js-std/bindings
Package: @ckb-js-std/bindings@1.0.0/typeHash:0x22e1932fa40de75d7c143dc3d9f2a2a4853c9a0c4caf89cb3ac3ce63939c7218, dataHash:0x29536e69b87dc8d252aeac561feadf25ecf36380d4272dcceece2393722beda1
Added @ckb-js-std/bindings@1.0.0/typeHash:0x22e1932fa40de75d7c143dc3d9f2a2a4853c9a0c4caf89cb3ac3ce63939c7218 to dependencies
```

List all the available packages on blockchain:

```sh
npm5 list --network testnet

# result
@ckb-js-std/bindings@1.0.0
  TypeHash: 0x22e1932fa40de75d7c143dc3d9f2a2a4853c9a0c4caf89cb3ac3ce63939c7218
  Outpoint: 0xd2cfc922d0a7f1444009a2c18633e028899d1514185f43bcba248136dab75582:0x0
  Controlled By Lock Hash: 0x4472b33b4e1845ebe82f2ce5f511bbe012f144c5f3d7b539909adffc83ccda61
--------------------------------------------------
```

But why?

Go read this post: [CKB, Version Control and Blockchain Evolution](https://talk.nervos.org/t/ckb-version-control-and-blockchain-evolution/4819)

## Overview

This project uses the CKB JavaScript VM (ckb-js-vm) to write smart contracts in TypeScript. The contracts are compiled to bytecode and can be deployed to the CKB blockchain. npm5 provides the tooling to manage these contracts as reusable packages that other developers can easily install and use in their projects.

## Project Structure

```text
npm5/
├── contracts/           # Smart contract source code
│   └── package/
│       └── src/
│           └── index.ts # Contract implementation
├── tests/              # Contract tests
│   └── package.test.ts
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

   You can unlink anytime later:

   ```bash
   npm unlink
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

1. Edit your contract in `contracts/<contract-name>/src/index.ts`
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
