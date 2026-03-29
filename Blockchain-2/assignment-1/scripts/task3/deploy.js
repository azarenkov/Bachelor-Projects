/**
 * Task 3 — Deploy Script
 *
 * Deploys both UnoptimizedStore and OptimizedStore contracts and
 * prints their addresses for use by the interact script.
 *
 * Usage:
 *   npx hardhat run scripts/task3/deploy.js --network localhost
 */
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // ── Deploy UnoptimizedStore ──
  const Unopt = await ethers.getContractFactory("UnoptimizedStore");
  const unopt = await Unopt.deploy();
  await unopt.waitForDeployment();
  const unoptAddr = await unopt.getAddress();

  // ── Deploy OptimizedStore (feeRate=300 = 3%, treasury=zero) ──
  const Opt = await ethers.getContractFactory("OptimizedStore");
  const opt = await Opt.deploy(300, ethers.ZeroAddress);
  await opt.waitForDeployment();
  const optAddr = await opt.getAddress();

  // ── Deployment gas comparison ──
  const unoptReceipt = await ethers.provider.getTransactionReceipt(
    unopt.deploymentTransaction().hash
  );
  const optReceipt = await ethers.provider.getTransactionReceipt(
    opt.deploymentTransaction().hash
  );

  console.log("\n┌──────────────────────┬──────────────────────────────────────────────┬────────────┐");
  console.log("│ Contract             │ Address                                      │ Deploy Gas │");
  console.log("├──────────────────────┼──────────────────────────────────────────────┼────────────┤");
  console.log(`│ UnoptimizedStore     │ ${unoptAddr} │ ${String(unoptReceipt.gasUsed).padEnd(10)} │`);
  console.log(`│ OptimizedStore       │ ${optAddr} │ ${String(optReceipt.gasUsed).padEnd(10)} │`);
  console.log("└──────────────────────┴──────────────────────────────────────────────┴────────────┘");

  console.log("\nSave these for interact.js:");
  console.log(`  UNOPT_ADDR=${unoptAddr}`);
  console.log(`  OPT_ADDR=${optAddr}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
