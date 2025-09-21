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
npm5 publish ./node_modules/yoctocolors -k 0xa5808e79c243d8e026a034273ad7a5ccdcb2f982392fd0230442b1734c98a4c2 --network testnet

# result
Publishing package from: ./node_modules/yoctocolors
Using network: testnet
Output directory: (using temp directory)
Published chunk /var/folders/js/czddptmd75n6_8wxks_4_ytm0000gn/T/npm5-build-1758347846473/chunks/yoctocolors-2.1.2.chunk001 in tx 0xd73d1b0c30b05015007882f2da3491f8c26ddd21acebba951f884308c18a3c1c
Package Type ID: 0x38c9207d7d27fbfd6de1e594ca896e68ae449514d934367e7e4859ca0cdf6620, Type Hash: 0x01e3fa1d15ad9bc06f5eabed61c8fcb793213ea450d53735c6a875ebddfd8e44
Transaction sent: 0x8315b0f9ec7a8d4edfaae86a4f9fcc29e7aff94f6477d4d158b8f2a18904ad8d
Package published at 0x8315b0f9ec7a8d4edfaae86a4f9fcc29e7aff94f6477d4d158b8f2a18904ad8d:0x0
```

Install the js package from blockchain:

```sh
npm5 add 0x01e3fa1d15ad9bc06f5eabed61c8fcb793213ea450d53735c6a875ebddfd8e44 --network testnet

# result
Using network: testnet
Found package cell: 0x8315b0f9ec7a8d4edfaae86a4f9fcc29e7aff94f6477d4d158b8f2a18904ad8d:0x0
Package data: {"name":"0x796f63746f636f6c6f7273000000000000000000","version":"0x322e312e32000000000000000000000000000000","hash":"0x37fd8c897b31d4127feee829d8e7489b1029627f","chunks":[{"hash":"0x37fd8c897b31d4127feee829d8e7489b1029627f450fd7a7e3843812d6589c0b","index":0}]}
Downloaded package: yoctocolors@2.1.2
Downloaded package to: /Users/retric/Desktop/test-npm5/node_modules/yoctocolors
Package: yoctocolors@2.1.2/typeHash:0x01e3fa1d15ad9bc06f5eabed61c8fcb793213ea450d53735c6a875ebddfd8e44, dataHash:0x8c947ead3f071e2ec5901cb919f324af15d46e51d20c8181c2f418fea5e47ec9
Added yoctocolors@2.1.2/typeHash:0x01e3fa1d15ad9bc06f5eabed61c8fcb793213ea450d53735c6a875ebddfd8e44 to dependencies
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
