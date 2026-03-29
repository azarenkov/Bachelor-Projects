/**
 * Task 5 — Deploy Script
 *
 * Deploys all security contracts:
 *   - VulnerableVault + Attacker (reentrancy)
 *   - FixedVault (reentrancy fix)
 *   - VulnerableAccess (access control misconfiguration)
 *   - FixedAccess (access control fix)
 *
 * Usage:
 *   npx hardhat run scripts/task5/deploy.js --network localhost
 */
const { ethers } = require("hardhat");

async function main() {
  const [deployer, attacker] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Attacker:", attacker.address);

  const deployed = {};

  // ── VulnerableVault ───────────────────────────────────────────────────────
  const VulnerableVault = await ethers.getContractFactory("VulnerableVault");
  const vulnVault = await VulnerableVault.deploy();
  await vulnVault.waitForDeployment();
  deployed.vulnVault = await vulnVault.getAddress();
  console.log("\nVulnerableVault deployed:", deployed.vulnVault);

  // ── Attacker (targets VulnerableVault) ───────────────────────────────────
  const Attacker = await ethers.getContractFactory("Attacker");
  const attackerContract = await Attacker.connect(attacker).deploy(deployed.vulnVault);
  await attackerContract.waitForDeployment();
  deployed.attacker = await attackerContract.getAddress();
  console.log("Attacker deployed       :", deployed.attacker);

  // ── FixedVault ────────────────────────────────────────────────────────────
  const FixedVault = await ethers.getContractFactory("FixedVault");
  const fixedVault = await FixedVault.deploy();
  await fixedVault.waitForDeployment();
  deployed.fixedVault = await fixedVault.getAddress();
  console.log("FixedVault deployed     :", deployed.fixedVault);

  // ── VulnerableAccess ──────────────────────────────────────────────────────
  const VulnerableAccess = await ethers.getContractFactory("VulnerableAccess");
  const vulnAccess = await VulnerableAccess.deploy();
  await vulnAccess.waitForDeployment();
  deployed.vulnAccess = await vulnAccess.getAddress();
  console.log("VulnerableAccess deployed:", deployed.vulnAccess);

  // ── FixedAccess ───────────────────────────────────────────────────────────
  const FixedAccess = await ethers.getContractFactory("FixedAccess");
  const fixedAccess = await FixedAccess.deploy(deployer.address);
  await fixedAccess.waitForDeployment();
  deployed.fixedAccess = await fixedAccess.getAddress();
  console.log("FixedAccess deployed     :", deployed.fixedAccess);

  console.log("\n── All deployed addresses ──────────────────────────────────");
  for (const [name, addr] of Object.entries(deployed)) {
    console.log(`  ${name.padEnd(18)}: ${addr}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
