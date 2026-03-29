const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("=== Deploying UUPS Proxy Pattern Contracts ===\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // Deploy LogicV1 with UUPS Proxy
  console.log("1. Deploying LogicV1 with UUPS proxy...");
  const LogicV1 = await ethers.getContractFactory("LogicV1");
  const proxy = await upgrades.deployProxy(LogicV1, [], {
    initializer: "initialize",
    kind: "uups",
  });
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  console.log("Proxy deployed to:", proxyAddress);

  const implV1Address = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("LogicV1 implementation at:", implV1Address, "\n");

  // Interact with LogicV1
  console.log("2. Testing LogicV1 functionality...");
  console.log("Initial counter:", (await proxy.counter()).toString());
  console.log("Version:", await proxy.getVersion());

  await proxy.increment();
  await proxy.increment();
  await proxy.increment();
  console.log("Counter after 3 increments:", (await proxy.counter()).toString(), "\n");

  // Upgrade to LogicV2
  console.log("3. Upgrading to LogicV2...");
  const LogicV2 = await ethers.getContractFactory("LogicV2");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, LogicV2);
  await upgraded.waitForDeployment();

  const implV2Address = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("LogicV2 implementation at:", implV2Address);
  console.log("Proxy address (unchanged):", await upgraded.getAddress(), "\n");

  // Verify state preservation
  console.log("4. Verifying state preservation after upgrade...");
  console.log("Counter after upgrade:", (await upgraded.counter()).toString());
  console.log("Version after upgrade:", await upgraded.getVersion());
  console.log("State preserved:", (await upgraded.counter()).toString() === "3" ? "✓" : "✗", "\n");

  // Test new LogicV2 functionality
  console.log("5. Testing LogicV2 new functionality...");
  console.log("Incrementing...");
  await upgraded.increment();
  console.log("Counter:", (await upgraded.counter()).toString());

  console.log("Decrementing...");
  await upgraded.decrement();
  console.log("Counter:", (await upgraded.counter()).toString());

  console.log("Resetting...");
  await upgraded.reset();
  console.log("Counter after reset:", (await upgraded.counter()).toString(), "\n");

  console.log("=== UUPS Proxy Deployment Complete ===");
  console.log("\nDeployed Addresses:");
  console.log("Proxy:", proxyAddress);
  console.log("LogicV1 Implementation:", implV1Address);
  console.log("LogicV2 Implementation:", implV2Address);
  console.log("\nNote: Users always interact with the Proxy address.");
  console.log("The implementation can be upgraded while preserving state.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
