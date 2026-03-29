/**
 * Task 2 — Interaction Script
 *
 * Step-by-step demonstration of UUPS proxy delegation:
 *   1. Deploy LogicV1 behind UUPS proxy
 *   2. Show proxy address stays constant; implementation changes
 *   3. Interact with V1 functions (increment, get)
 *   4. Upgrade to LogicV2 — state preserved
 *   5. Interact with V2 new functions (decrement, reset)
 *   6. Confirm only owner can upgrade or call restricted functions
 *
 * Usage:
 *   npx hardhat run scripts/task2/interact.js --network localhost
 */
const { ethers, upgrades } = require("hardhat");

function separator(label) {
  const line = "─".repeat(52);
  console.log(`\n┌${line}┐`);
  console.log(`│  ${label.padEnd(50)}│`);
  console.log(`└${line}┘`);
}

async function main() {
  const [deployer, other] = await ethers.getSigners();
  console.log("Owner :", deployer.address);
  console.log("Other :", other.address);

  // ───────────────────────────────────────────────────────────────────────────
  separator("Step 1 — Deploy LogicV1 behind UUPS Proxy");
  // ───────────────────────────────────────────────────────────────────────────
  const LogicV1 = await ethers.getContractFactory("LogicV1");
  const proxy = await upgrades.deployProxy(LogicV1, [deployer.address], {
    initializer: "initialize",
    kind: "uups",
  });
  await proxy.waitForDeployment();
  const proxyAddr = await proxy.getAddress();

  // EIP-1967 implementation slot
  const implSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
  const rawImpl = await ethers.provider.getStorage(proxyAddr, implSlot);
  const implAddrV1 = ethers.getAddress("0x" + rawImpl.slice(-40));

  console.log("Proxy address       :", proxyAddr);
  console.log("Implementation (V1) :", implAddrV1);
  console.log("Version             :", await proxy.version());
  console.log("Counter             :", (await proxy.get()).toString());

  // ───────────────────────────────────────────────────────────────────────────
  separator("Step 2 — Interact with V1 (increment)");
  // ───────────────────────────────────────────────────────────────────────────
  console.log("Calling increment() three times via proxy...");
  await (await proxy.increment()).wait();
  await (await proxy.increment()).wait();
  await (await proxy.increment()).wait();
  console.log("Counter after 3 increments:", (await proxy.get()).toString());

  // Show that non-owner cannot upgrade
  console.log("\nAttempting upgrade from non-owner account...");
  const LogicV2factory = await ethers.getContractFactory("LogicV2", other);
  try {
    await upgrades.upgradeProxy(proxy, LogicV2factory, {
      kind: "uups",
      call: { fn: "initializeV2" },
    });
    console.log("ERROR: should have reverted!");
  } catch {
    console.log("✓ Upgrade by non-owner reverted as expected");
  }

  // ───────────────────────────────────────────────────────────────────────────
  separator("Step 3 — Upgrade to LogicV2 (owner only)");
  // ───────────────────────────────────────────────────────────────────────────
  const LogicV2 = await ethers.getContractFactory("LogicV2");
  const proxyV2 = await upgrades.upgradeProxy(proxy, LogicV2, {
    kind: "uups",
    call: { fn: "initializeV2" },
  });
  await proxyV2.waitForDeployment();

  const rawImplV2 = await ethers.provider.getStorage(proxyAddr, implSlot);
  const implAddrV2 = ethers.getAddress("0x" + rawImplV2.slice(-40));

  console.log("Proxy address (unchanged):", await proxyV2.getAddress());
  console.log("Implementation (V2)      :", implAddrV2);
  console.log("Impl changed             :", implAddrV1 !== implAddrV2);
  console.log("Version                  :", await proxyV2.version());
  console.log("Counter (preserved)      :", (await proxyV2.get()).toString(), "← still 3!");

  // ───────────────────────────────────────────────────────────────────────────
  separator("Step 4 — Interact with V2 new functions");
  // ───────────────────────────────────────────────────────────────────────────
  await (await proxyV2.increment()).wait();
  console.log("After increment :", (await proxyV2.get()).toString()); // 4

  await (await proxyV2.decrement()).wait();
  await (await proxyV2.decrement()).wait();
  console.log("After 2 decrements:", (await proxyV2.get()).toString()); // 2

  // Non-owner cannot reset
  try {
    await proxyV2.connect(other).reset();
    console.log("ERROR: should have reverted!");
  } catch {
    console.log("✓ reset() by non-owner reverted as expected");
  }

  // Owner resets
  await (await proxyV2.reset()).wait();
  console.log("After reset (owner):", (await proxyV2.get()).toString()); // 0

  // ───────────────────────────────────────────────────────────────────────────
  separator("Step 5 — Decrement below zero reverts");
  // ───────────────────────────────────────────────────────────────────────────
  try {
    await proxyV2.decrement();
    console.log("ERROR: should have reverted!");
  } catch (e) {
    console.log("✓ decrement() at zero reverts:", e.reason || "reverted");
  }

  console.log("\nAll proxy interactions completed successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
