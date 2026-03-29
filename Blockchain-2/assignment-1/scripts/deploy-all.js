const hre = require("hardhat");

async function main() {
  console.log("=== Deploying All Contracts ===\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  const deployedAddresses = {};

  // 1. Deploy Factory Pattern
  console.log("1. Deploying Factory Pattern...");
  const Factory = await hre.ethers.getContractFactory("Factory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  deployedAddresses.Factory = await factory.getAddress();
  console.log("   Factory:", deployedAddresses.Factory, "\n");

  // 2. Deploy UUPS Proxy (LogicV1)
  console.log("2. Deploying UUPS Proxy Pattern...");
  const { ethers, upgrades } = require("hardhat");
  const LogicV1 = await ethers.getContractFactory("LogicV1");
  const proxy = await upgrades.deployProxy(LogicV1, [], {
    initializer: "initialize",
    kind: "uups",
  });
  await proxy.waitForDeployment();
  deployedAddresses.ProxyLogicV1 = await proxy.getAddress();
  deployedAddresses.LogicV1Implementation = await upgrades.erc1967.getImplementationAddress(deployedAddresses.ProxyLogicV1);
  console.log("   Proxy:", deployedAddresses.ProxyLogicV1);
  console.log("   LogicV1 Implementation:", deployedAddresses.LogicV1Implementation, "\n");

  // 3. Deploy Gas Optimization Contracts
  console.log("3. Deploying Gas Optimization Contracts...");
  const Unoptimized = await hre.ethers.getContractFactory("UnoptimizedContract");
  const unoptimized = await Unoptimized.deploy();
  await unoptimized.waitForDeployment();
  deployedAddresses.UnoptimizedContract = await unoptimized.getAddress();

  const Optimized = await hre.ethers.getContractFactory("OptimizedContract");
  const optimized = await Optimized.deploy();
  await optimized.waitForDeployment();
  deployedAddresses.OptimizedContract = await optimized.getAddress();

  console.log("   UnoptimizedContract:", deployedAddresses.UnoptimizedContract);
  console.log("   OptimizedContract:", deployedAddresses.OptimizedContract, "\n");

  // 4. Deploy Assembly Contract
  console.log("4. Deploying Assembly Contract...");
  const Assembly = await hre.ethers.getContractFactory("AssemblyContract");
  const assembly = await Assembly.deploy();
  await assembly.waitForDeployment();
  deployedAddresses.AssemblyContract = await assembly.getAddress();
  console.log("   AssemblyContract:", deployedAddresses.AssemblyContract, "\n");

  // 5. Deploy Security Contracts
  console.log("5. Deploying Security Contracts...");

  const VulnerableVault = await hre.ethers.getContractFactory("VulnerableVault");
  const vulnerableVault = await VulnerableVault.deploy();
  await vulnerableVault.waitForDeployment();
  deployedAddresses.VulnerableVault = await vulnerableVault.getAddress();

  const FixedVault = await hre.ethers.getContractFactory("FixedVault");
  const fixedVault = await FixedVault.deploy();
  await fixedVault.waitForDeployment();
  deployedAddresses.FixedVault = await fixedVault.getAddress();

  const VulnerableAccess = await hre.ethers.getContractFactory("VulnerableAccess");
  const vulnerableAccess = await VulnerableAccess.deploy();
  await vulnerableAccess.waitForDeployment();
  deployedAddresses.VulnerableAccess = await vulnerableAccess.getAddress();

  const FixedAccess = await hre.ethers.getContractFactory("FixedAccess");
  const fixedAccess = await FixedAccess.deploy();
  await fixedAccess.waitForDeployment();
  deployedAddresses.FixedAccess = await fixedAccess.getAddress();

  console.log("   VulnerableVault:", deployedAddresses.VulnerableVault);
  console.log("   FixedVault:", deployedAddresses.FixedVault);
  console.log("   VulnerableAccess:", deployedAddresses.VulnerableAccess);
  console.log("   FixedAccess:", deployedAddresses.FixedAccess, "\n");

  // Summary
  console.log("=== Deployment Complete ===\n");
  console.log("All Deployed Addresses:");
  console.log(JSON.stringify(deployedAddresses, null, 2));

  // Save to file
  const fs = require("fs");
  fs.writeFileSync(
    "deployed-addresses.json",
    JSON.stringify(deployedAddresses, null, 2)
  );
  console.log("\nAddresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
