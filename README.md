# npm5

> Code is common knowledge!

A decentralized js package manager built on the CKB blockchain. npm5 enables developers to easily discover, install, and manage js libraries across CKB networks.

Let's starts a devnet for testing to see how it works at a glance:

```sh
offckb node
```

Publish the js package to blockchain:

```sh
npm5 publish ./node_modules/yoctocolors -k 0x6109170b275a09ad54877b82f7d9930f88cab5717d484fb4741ae9d1dd078cd6

#result
Publishing package from: ./node_modules/yoctocolors
Using network: devnet
Output directory: ./test-package
Published chunk /Users/retric/Desktop/test-npm5/test-package/chunks/yoctocolors-2.1.2.chunk001 in tx 0xff98073fe8eb6b54c2743fd897792f4c99c4b5800b6c5a1df22e05db80436a66
Package Type ID: 0x09d303218790f54ed59369d3d4ab2870dfb32c8871f4f5573ad8c363f627719f, Type Hash: 0x3b7aa7d2275c1045c2415fa39c71bf41b38b5e0c553cc874e885cdd178d30498
Transaction sent: 0x620001cebcf3984128740782c31d2ddb98caa2d47f4b63ad5b2dc2f114703579
Package published at 0x620001cebcf3984128740782c31d2ddb98caa2d47f4b63ad5b2dc2f114703579:0x0
```

Install via its hash type and use it in your js project just like the npm-way!

```sh
npm5 add 0x3b7aa7d2275c1045c2415fa39c71bf41b38b5e0c553cc874e885cdd178d30498

#result
Using network: devnet
Found package cell: 0x620001cebcf3984128740782c31d2ddb98caa2d47f4b63ad5b2dc2f114703579:0x0
Package data: {"name":"0x796f63746f636f6c6f7273000000000000000000","version":"0x322e312e32000000000000000000000000000000","hash":"0x37fd8c897b31d4127feee829d8e7489b1029627f","chunks":[{"hash":"0x37fd8c897b31d4127feee829d8e7489b1029627f450fd7a7e3843812d6589c0b","index":0}]}
Downloaded package: yoctocolors@2.1.2
Downloaded package to: /Users/retric/Desktop/test-npm5/node_modules/yoctocolors
Package: yoctocolors@2.1.2/typeHash:0x3b7aa7d2275c1045c2415fa39c71bf41b38b5e0c553cc874e885cdd178d30498, dataHash:0x8c947ead3f071e2ec5901cb919f324af15d46e51d20c8181c2f418fea5e47ec9
Added yoctocolors@2.1.2/typeHash:0x3b7aa7d2275c1045c2415fa39c71bf41b38b5e0c553cc874e885cdd178d30498 to dependencies
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
