```markdown
# 🌱 ROOT — Watch Your Crypto Grow in Real-Time

**Plant capital. Stream yield. Harvest anytime.**

ROOT is a non-custodial DeFi yield app that lets you deposit ETH and watch your earnings flow into your wallet **every second**. No other protocol gives you real-time, on-chain yield streaming.

---

## ✨ Features

- **🌊 Live Yield Streaming** — See every wei tick up in real-time. Your earnings stream live, second by second.
- **🔒 Non-Custodial** — You keep full control of your keys. All interactions happen directly with auditable smart contracts.
- **🌾 Simple Deposits & Withdrawals** — Plant ETH with one click. Harvest your principal + growth anytime. No lockups.
- **🔄 Compound Growth** — Reinvest your earned yield back into the pool to maximize returns.
- **📜 On-Chain History** — Every deposit, withdrawal, compound, and bridge event is recorded on Ethereum (Sepolia testnet) and viewable on Etherscan.
- **🌉 Cross-Chain Bridge** — Lock tokens on one chain and receive them on another (Sepolia, Goerli, Mumbai, BSC Testnet).
- **💱 Token Swap** — Instantly swap between ETH, USDC, DAI, MATIC, and BNB directly in the app.
- **📊 Real-Time Analytics** — Track your position growth with progress bars and APY badges.

---

## 🧠 Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Frontend     | HTML, CSS, JavaScript (vanilla)     |
| Web3         | ethers.js v5 (browser), ethers v6 (Hardhat) |
| Smart Contracts | Solidity ^0.8.19               |
| Dev Framework | Hardhat 2.22.19                    |
| Network      | Sepolia Testnet                     |
| RPC Provider | Alchemy / Infura                    |

---

## 🚀 Quick Start

### Prerequisites
- [MetaMask](https://metamask.io/) browser extension
- Sepolia testnet ETH (get from [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia))

### Run the App
1. Clone or download this repository.
2. Open `index.html` in your browser (no build step required).
3. Connect your MetaMask wallet (switch to **Sepolia Testnet**).
4. Click **"Plant Your Capital"** and deposit ETH.
5. Watch the live yield counter tick up!

> **No local server needed.** The frontend is entirely static. All blockchain data is read directly from the Sepolia testnet.

---

## 📦 Deployment (Smart Contracts)

If you want to deploy your own instance of the contracts:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create a `.env` file in the root:
   ```
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
   PRIVATE_KEY=your_wallet_private_key  # without 0x prefix
   ```

3. **Compile & Deploy**
   ```bash
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network sepolia
   ```

4. **Update frontend addresses**
   Copy the deployed contract addresses into `js/contracts.js`:
   ```js
   const YIELD_CONTRACT_ADDRESS = "0x...";
   const BRIDGE_CONTRACT_ADDRESS = "0x...";
   ```

5. **Verify on Etherscan** (optional)
   ```bash
   npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS
   ```

---

## 📜 Smart Contracts

### RootVault (`contracts/RootVault.sol`)
The core yield vault where users deposit ETH and earn yield over time.

- `deposit()` — Deposit ETH into the vault.
- `withdrawAll()` — Withdraw principal + accumulated yield.
- `compound()` — Reinvest pending yield into the deposit.
- `calculateYield(address)` — Returns the current pending yield for a user.
- `getUserPosition(address)` — Returns full user position details.
- `setAPY(uint256)` — Owner can adjust the APY (max 50%).

### BridgeRouter (`contracts/BridgeRouter.sol`)
A simple lock-and-release bridge for moving assets between supported testnets.

- `lockTokens(toChainId, token, amount, recipient)` — Lock tokens on the current chain to be released on `toChainId`.
- `setChainSupport(chainId, supported)` — Owner can enable/disable destination chains.

---

## 🧪 Usage Guide

### Dashboard
- **Live Yield Card** — Shows your earned yield streaming in real time. Green pulsing digits indicate active growth.
- **Balance Card** — Displays your total wallet balance, deposited amount, and USD value.
- **Your Root Position** — Shows your deposited ETH, earnings, and a progress bar.

### Actions Tab
- **Plant** — Deposit more ETH.
- **Compound** — Reinvest earnings.
- **Harvest** — Withdraw all funds + yield.
- **Bridge** — Jump to the Bridge tab.

### History Tab
All on-chain transactions (deposits, withdrawals, compounds) are loaded directly from contract events. Click any transaction to view it on Etherscan.

### Bridge Tab
- **Bridge Mode** — Select source and destination chains, enter an amount, and lock tokens for cross-chain transfer.
- **Swap Mode** — Select a token pair (e.g., ETH → USDC) to simulate a swap (demo only; in production, integrate a DEX).

---

## 🏆 Why ROOT

- **Unique live yield streaming** — Not a static APY number. Users watch their money grow in real-time. That's addictive, transparent, and instantly shareable.
- **Dead-simple onboarding** — No complex forms. Connect wallet, deposit, done.
- **Fully on-chain** — Every transaction is verifiable on Etherscan. No centralized databases, no off-chain magic.
- **Polished UX** — Smooth animations, clear states (loading, error, success), mobile-first design.
- **Extensible** — Bridge, swap, and strategy modules ready for production.

---

## ⚠️ Security & Disclaimer

This project is a **testnet prototype** and has not been professionally audited. Use only with test ETH on Sepolia. For production, obtain a security audit, add a timelock to owner functions, and consider a multisig wallet.
