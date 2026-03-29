const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // ── Deploy LogicV1 behind UUPS proxy ──
  const LogicV1 = await ethers.getContractFactory("LogicV1");
  const proxy = await upgrades.deployProxy(LogicV1, [deployer.address], {
    initializer: "initialize",
    kind: "uups",
  });
  await proxy.waitForDeployment();
  const proxyAddr = await proxy.getAddress();
  console.log("\nProxy (V1) deployed to:", proxyAddr);
  console.log("Version:", await proxy.version());
  console.log("Counter:", await proxy.get());

  // ── Interact with V1 ──
  await proxy.increment();
  await proxy.increment();
  await proxy.increment();
  console.log("\nAfter 3 increments, counter:", await proxy.get());

  // ── Upgrade to LogicV2 ──
  console.log("\nUpgrading to V2...");
  const LogicV2 = await ethers.getContractFactory("LogicV2");
  const proxyV2 = await upgrades.upgradeProxy(proxy, LogicV2, {
    kind: "uups",
    call: { fn: "initializeV2" },
  });
  await proxyV2.waitForDeployment();

  console.log("Proxy still at:", await proxyV2.getAddress());
  console.log("Version:", await proxyV2.version());
  console.log("Counter (preserved):", await proxyV2.get()); // should be 3

  // ── Use new V2 functions ──
  await proxyV2.decrement();
  console.log("\nAfter decrement:", await proxyV2.get()); // should be 2

  await proxyV2.reset();
  console.log("After reset:", await proxyV2.get()); // should be 0

  console.log("\nUpgrade complete. State was preserved across upgrade.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
