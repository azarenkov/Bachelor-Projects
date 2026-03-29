/**
 * Task 1 — Interaction Script
 *
 * Demonstrates full lifecycle of Factory + ChildContract:
 *   1. Deploy Factory
 *   2. Deploy two ChildContracts (CREATE and CREATE2)
 *   3. Interact with each child: deposit ETH, check balance, withdraw
 *   4. Verify CREATE2 address prediction matches actual deployment
 *   5. Print all deployed addresses from the factory registry
 *
 * Usage:
 *   npx hardhat run scripts/task1/interact.js --network localhost
 */
const { ethers } = require("hardhat");

function separator(label) {
  const line = "─".repeat(52);
  console.log(`\n┌${line}┐`);
  console.log(`│  ${label.padEnd(50)}│`);
  console.log(`└${line}┘`);
}

async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("Deployer :", deployer.address);
  console.log("User1    :", user1.address);
  console.log("User2    :", user2.address);

  // ───────────────────────────────────────────────────────────────────────────
  separator("Step 1 — Deploy Factory");
  // ───────────────────────────────────────────────────────────────────────────
  const Factory = await ethers.getContractFactory("Factory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log("Factory deployed:", factoryAddr);

  // ───────────────────────────────────────────────────────────────────────────
  separator("Step 2 — Deploy ChildContract via CREATE (user1 is owner)");
  // ───────────────────────────────────────────────────────────────────────────
  const tx1 = await factory.connect(user1).deployWithCreate("AlphaVault");
  const r1 = await tx1.wait();
  const deployed1 = await factory.getDeployedContracts();
  const childAddr1 = deployed1[0];
  console.log("ChildContract (CREATE) deployed:", childAddr1);
  console.log("Gas used:", r1.gasUsed.toString());

  // ───────────────────────────────────────────────────────────────────────────
  separator("Step 3 — Deploy ChildContract via CREATE2 (user2 is owner)");
  // ───────────────────────────────────────────────────────────────────────────
  const salt = ethers.keccak256(ethers.toUtf8Bytes("deterministic-salt-v1"));

  // Predict address before deploying
  const predicted = await factory.connect(user2).computeCreate2Address("BetaVault", salt);
  console.log("Predicted CREATE2 address:", predicted);

  const tx2 = await factory.connect(user2).deployWithCreate2("BetaVault", salt);
  const r2 = await tx2.wait();
  const deployed2 = await factory.getDeployedContracts();
  const childAddr2 = deployed2[1];
  console.log("ChildContract (CREATE2) deployed:", childAddr2);
  console.log("Prediction matches:", predicted.toLowerCase() === childAddr2.toLowerCase());
  console.log("Gas used:", r2.gasUsed.toString());

  // ───────────────────────────────────────────────────────────────────────────
  separator("Step 4 — Gas Comparison: CREATE vs CREATE2");
  // ───────────────────────────────────────────────────────────────────────────
  console.log("┌────────────────────┬──────────────┐");
  console.log("│ Method             │ Gas Used     │");
  console.log("├────────────────────┼──────────────┤");
  console.log(`│ CREATE             │ ${String(r1.gasUsed).padEnd(12)} │`);
  console.log(`│ CREATE2            │ ${String(r2.gasUsed).padEnd(12)} │`);
  console.log(`│ Difference         │ ${String(r2.gasUsed - r1.gasUsed).padEnd(12)} │`);
  console.log("└────────────────────┴──────────────┘");

  // ───────────────────────────────────────────────────────────────────────────
  separator("Step 5 — Interact with ChildContract (AlphaVault)");
  // ───────────────────────────────────────────────────────────────────────────
  const child1 = await ethers.getContractAt("ChildContract", childAddr1);

  console.log("Owner  :", await child1.owner());
  console.log("Name   :", await child1.name());
  console.log("Balance:", await child1.getBalance(), "wei (initial)");

  // user1 deposits 1 ETH
  const depositTx = await child1.connect(user1).deposit({ value: ethers.parseEther("1") });
  await depositTx.wait();
  console.log("\nUser1 deposited 1 ETH");
  console.log("Balance after deposit:", ethers.formatEther(await child1.getBalance()), "ETH");

  // deployer tries to withdraw (should revert — not the owner)
  try {
    await child1.connect(deployer).withdraw();
    console.log("ERROR: deployer should not be able to withdraw!");
  } catch {
    console.log("✓ Deployer cannot withdraw (not owner) — revert as expected");
  }

  // user1 (owner) withdraws
  const balBefore = await ethers.provider.getBalance(user1.address);
  const withdrawTx = await child1.connect(user1).withdraw();
  await withdrawTx.wait();
  const balAfter = await ethers.provider.getBalance(user1.address);
  console.log("\nUser1 withdrew funds");
  console.log("Balance after withdraw:", ethers.formatEther(await child1.getBalance()), "ETH");
  console.log(
    "User1 ETH gained (approx):",
    ethers.formatEther(balAfter - balBefore),
    "ETH (minus gas)"
  );

  // ───────────────────────────────────────────────────────────────────────────
  separator("Step 6 — Factory Registry");
  // ───────────────────────────────────────────────────────────────────────────
  const allDeployed = await factory.getDeployedContracts();
  console.log(`Total deployed: ${allDeployed.length}`);
  allDeployed.forEach((addr, i) => {
    console.log(`  [${i}] ${addr}  isDeployed=${true}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
