const hre = require("hardhat");

async function main() {
  console.log("🌱 Deploying ROOT contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  console.log("1/2 Deploying RootVault...");
  const RootVault = await hre.ethers.getContractFactory("RootVault");
  const vault = await RootVault.deploy();
  await vault.waitForDeployment(); // ethers v6
  const vaultAddr = await vault.getAddress();
  console.log("✅ RootVault:", vaultAddr, "\n");

  console.log("2/2 Deploying BridgeRouter...");
  const BridgeRouter = await hre.ethers.getContractFactory("BridgeRouter");
  const bridge = await BridgeRouter.deploy();
  await bridge.waitForDeployment();
  const bridgeAddr = await bridge.getAddress();
  console.log("✅ BridgeRouter:", bridgeAddr, "\n");

  console.log("Configuring chains...");
  try {
    await bridge.setChainSupport(5, true);
    await bridge.setChainSupport(80001, true);
    await bridge.setChainSupport(97, true);
    console.log("✅ Chains configured\n");
  } catch (e) {
    console.log("⚠️ Chain config skipped:", e.message, "\n");
  }

  console.log("=".repeat(50));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(50));
  console.log("");
  console.log("Update js/contracts.js:");
  console.log(`  YIELD_CONTRACT_ADDRESS = "${vaultAddr}"`);
  console.log(`  BRIDGE_CONTRACT_ADDRESS = "${bridgeAddr}"`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });