# npm5: JavaScript Packages on the Blockchain? Yeah, We Did That

_September 25, 2025_ - Ever get tired of trusting some random server with your code dependencies? What if I told you there's a package manager that runs entirely on a blockchain? No central servers, no single points of failure, just pure, decentralized JavaScript package management. Welcome to **npm5**.

## The Problem with the Current Setup

Let's be real - traditional package managers like npm work great... until they don't. You're basically putting all your trust in a single company to:

- Keep their servers running
- Not mess with your packages
- Not get hacked
- Not decide they don't like your favorite library

npm5 flips this on its head by storing everything on the CKB blockchain. Your packages become immutable, censorship-resistant, and discoverable by anyone with a blockchain connection.

## What Makes npm5 Different

**"Code is common knowledge!"** - That's our motto. Instead of package names and versions, npm5 uses **CKB type script hashes** to identify packages. This means:

- 📦 **No more naming conflicts** - Every package has a unique cryptographic ID
- 🔒 **Tamper-proof** - Once published, packages can't be changed or removed
- 🌐 **Truly decentralized** - No central authority can control what you can install
- ⚡ **Blockchain-verified** - Package integrity is guaranteed by consensus

## How It Actually Works

### The Tech Stack

npm5 is built with some cool tech:

- **CKB JavaScript VM** - Smart contracts in TypeScript (yes, you read that right)
- **Chunked storage** - Big packages get split into 300KB pieces for efficient blockchain storage
- **Type hash identification** - Cryptographic package IDs instead of human-readable names
- **Multi-network support** - Works on devnet, testnet, and mainnet

### The CLI That Feels Familiar

We didn't reinvent the wheel - the npm5 CLI feels like the npm you already know:

```bash
# Install npm5 (it's a package itself!)
npm install -g @retric/npm5

# Publish any npm package to the blockchain
npm5 publish ./node_modules/lodash \
  --private-key YOUR_PRIVATE_KEY \
  --network testnet

# Install by type hash (yeah, it's different)
npm5 add 0x01e3fa1d15ad9bc06f5eabed61c8fcb793213ea450d53735c6a875ebddfd8e44 \
  --network testnet

# See what's available
npm5 list --network testnet
```

## Under the Hood

### Smart Contracts in TypeScript

The magic happens in smart contracts written in TypeScript that compile to CKB bytecode:

```typescript
// This runs on the blockchain!
function main(): number {
  // Verify this is actually our contract
  HighLevel.checkTypeId(35);

  // Load package metadata from the cell
  const packageData = PackageDataCodec.decode(data);

  // Make sure all the package chunks exist on-chain
  for (const chunk of packageData.chunks) {
    const found = HighLevel.findCellByDataHash(
      bindings.hex.decode(chunk.hash),
      HighLevel.SOURCE_CELL_DEP,
    );
    if (found === null) {
      return 1; // Package is invalid!
    }
  }

  return 0; // All good!
}
```

### Package Structure

Every package gets broken down into a clean data structure:

```typescript
interface PackageData {
  name: string; // Package name (fits in 20 bytes)
  version: string; // Semver version (also 20 bytes)
  hash: string; // Full package hash for integrity
  chunks: Chunk[]; // The actual package data, split up
}

interface Chunk {
  hash: string; // Content hash of this chunk
  index: number; // Which piece of the package this is
}
```

## Getting Started (It's Actually Easy)

### Quick Setup

```bash
# Get the code
git clone https://github.com/RetricSu/npm5.git
cd npm5

# Install everything
pnpm install

# Build the CLI
pnpm run build:cli

# Make it globally available
npm link
```

### Try It Out

```bash
# Publish something simple
npm5 publish ./node_modules/colors \
  --private-key YOUR_PRIVATE_KEY \
  --network testnet

# Install it somewhere else
npm5 add THE_TYPE_HASH_YOU_GOT \
  --network testnet
```

## The Bigger Picture

npm5 isn't just about package management - it's about treating code as **common knowledge** that lives forever on a blockchain. No more worrying about:

- Packages disappearing from registries
- Supply chain attacks on central servers
- Companies changing their minds about hosting your code

This is blockchain doing something practical for developers, not just finance bros.

## Current Status

We're at v0.1.0 - the core stuff works, but there's plenty more to build:

- ✅ Basic publish/install cycle
- ✅ CLI that doesn't suck
- ✅ Smart contract validation
- ✅ Chunked package storage
- ✅ Works on testnet

Coming soon:

- 🔍 Package search and discovery
- 📋 Proper dependency management
- 🔄 Version upgrades and updates
- 🛠️ IDE integrations
- 🔐 Enhanced security features

## Why Should You Care?

If you're a JavaScript developer who:

- Worries about dependency supply chain security
- Wants to experiment with blockchain tech
- Believes in decentralized infrastructure
- Just wants to try something different

npm5 is for you. It's a working prototype that shows how blockchain can make software distribution more robust and trustworthy.

## Join the Fun

This is open source - come contribute, break things, suggest crazy ideas. The repo is at [https://github.com/RetricSu/npm5](https://github.com/RetricSu/npm5).

Think npm was revolutionary? Wait till you see what decentralized package management can do. 🚀

---

_Built with ❤️ on the CKB blockchain. Code is common knowledge!_"
