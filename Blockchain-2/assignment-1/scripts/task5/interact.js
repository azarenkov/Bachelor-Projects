/**
 * Task 5 — Interaction Script
 *
 * Demonstrates both vulnerabilities end-to-end:
 *
 * Vulnerability A: Reentrancy
 *   1. Deploy VulnerableVault — victim deposits 5 ETH
 *   2. Deploy Attacker — runs exploit, drains vault
 *   3. Show vault drained to 0
 *   4. Deploy FixedVault (CEI + ReentrancyGuard)
 *   5. Same attack fails — vault balance preserved
 *
 * Vulnerability B: Access Control
 *   6. Deploy VulnerableAccess — owner deposits 3 ETH
 *   7. Attacker calls setOwner() and withdraw() — succeeds (bug!)
 *   8. Deploy FixedAccess (Ownable)
 *   9. Attacker tries withdraw() — reverts (fix works!)
 *
 * Usage:
 *   npx hardhat run scripts/task5/interact.js --network localhost
 */
const { ethers } = require("hardhat");

function separator(label) {
  const line = "─".repeat(54);
  console.log(`\n┌${line}┐`);
  console.log(`│  ${label.padEnd(52)}│`);
  console.log(`└${line}┘`);
}

function eth(wei) {
  return ethers.formatEther(wei) + " ETH";
}

async function main() {
  const [deployer, victim, attackerEOA] = await ethers.getSigners();
  console.log("Deployer :", deployer.address);
  console.log("Victim   :", victim.address);
  console.log("Attacker :", attackerEOA.address);

  // ═══════════════════════════════════════════════════════════════════════════
  //  VULNERABILITY A — Reentrancy
  // ═══════════════════════════════════════════════════════════════════════════

  separator("A1 — Deploy VulnerableVault");
  const VulnerableVault = await ethers.getContractFactory("VulnerableVault");
  const vulnVault = await VulnerableVault.deploy();
  await vulnVault.waitForDeployment();
  const vulnVaultAddr = await vulnVault.getAddress();
  console.log("VulnerableVault:", vulnVaultAddr);

  // Victim deposits 5 ETH
  await (await vulnVault.connect(victim).deposit({ value: ethers.parseEther("5") })).wait();
  console.log("Victim deposited 5 ETH");
  console.log("Vault balance   :", eth(await vulnVault.getBalance()));

  separator("A2 — Deploy Attacker contract");
  const AttackerFactory = await ethers.getContractFactory("Attacker");
  const attackerContract = await AttackerFactory.connect(attackerEOA).deploy(vulnVaultAddr);
  await attackerContract.waitForDeployment();
  const attackerAddr = await attackerContract.getAddress();
  console.log("Attacker contract:", attackerAddr);

  separator("A3 — Execute Reentrancy Exploit on VulnerableVault");
  const vaultBefore = await vulnVault.getBalance();
  console.log("Vault balance before attack:", eth(vaultBefore));

  // Attacker deposits 1 ETH, exploit re-enters withdraw() draining all funds
  await (await attackerContract.connect(attackerEOA).attack({ value: ethers.parseEther("1") })).wait();

  const vaultAfter = await vulnVault.getBalance();
  console.log("Vault balance after attack :", eth(vaultAfter));
  console.log("Funds stolen               :", eth(vaultBefore - vaultAfter));
  console.log("✓ EXPLOIT SUCCEEDED — VulnerableVault drained to", eth(vaultAfter));

  separator("A4 — Deploy FixedVault (CEI + ReentrancyGuard)");
  const FixedVault = await ethers.getContractFactory("FixedVault");
  const fixedVault = await FixedVault.deploy();
  await fixedVault.waitForDeployment();
  const fixedVaultAddr = await fixedVault.getAddress();
  console.log("FixedVault:", fixedVaultAddr);

  // Victim deposits 5 ETH into fixed vault
  await (await fixedVault.connect(victim).deposit({ value: ethers.parseEther("5") })).wait();
  console.log("Victim deposited 5 ETH into FixedVault");
  console.log("FixedVault balance:", eth(await fixedVault.getBalance()));

  separator("A5 — Same Attack on FixedVault (should fail)");
  const AttackerFixed = await ethers.getContractFactory("Attacker");
  const attackerFixed = await AttackerFixed.connect(attackerEOA).deploy(fixedVaultAddr);
  await attackerFixed.waitForDeployment();

  const fixedBefore = await fixedVault.getBalance();
  try {
    await attackerFixed.connect(attackerEOA).attack({ value: ethers.parseEther("1") });
    console.log("ERROR: attack should have reverted!");
  } catch {
    console.log("✓ EXPLOIT FAILED on FixedVault — ReentrancyGuard blocked re-entry");
  }
  const fixedAfter = await fixedVault.getBalance();
  console.log("FixedVault balance preserved:", eth(fixedAfter), "(was", eth(fixedBefore) + ")");

  // Normal withdraw still works on FixedVault
  await (await fixedVault.connect(victim).withdraw()).wait();
  console.log("✓ Victim withdrew their 5 ETH normally from FixedVault");

  // ═══════════════════════════════════════════════════════════════════════════
  //  VULNERABILITY B — Access Control Misconfiguration
  // ═══════════════════════════════════════════════════════════════════════════

  separator("B1 — Deploy VulnerableAccess");
  const VulnerableAccess = await ethers.getContractFactory("VulnerableAccess");
  const vulnAccess = await VulnerableAccess.deploy();
  await vulnAccess.waitForDeployment();
  const vulnAccessAddr = await vulnAccess.getAddress();
  console.log("VulnerableAccess:", vulnAccessAddr);

  // Owner deposits 3 ETH
  await (await vulnAccess.connect(deployer).deposit({ value: ethers.parseEther("3") })).wait();
  const ownerBefore = await vulnAccess.owner();
  const vaultBalB = await ethers.provider.getBalance(vulnAccessAddr);
  console.log("Owner           :", ownerBefore);
  console.log("Vault balance   :", eth(vaultBalB));

  separator("B2 — Exploit: attacker hijacks ownership (unprotected setOwner)");
  await (await vulnAccess.connect(attackerEOA).setOwner(attackerEOA.address)).wait();
  const ownerAfter = await vulnAccess.owner();
  console.log("Owner after setOwner():", ownerAfter);
  console.log("✓ EXPLOIT — attacker now owns the contract:", ownerAfter === attackerEOA.address);

  separator("B3 — Exploit: attacker drains vault (unprotected withdraw)");
  const attackerBalBefore = await ethers.provider.getBalance(attackerEOA.address);
  await (await vulnAccess.connect(attackerEOA).withdraw(attackerEOA.address)).wait();
  const vaultBalAfter = await ethers.provider.getBalance(vulnAccessAddr);
  const attackerBalAfter = await ethers.provider.getBalance(attackerEOA.address);
  console.log("Vault balance after drain:", eth(vaultBalAfter));
  console.log("Attacker gained (approx) :", eth(attackerBalAfter - attackerBalBefore), "(minus gas)");
  console.log("✓ EXPLOIT SUCCEEDED — VulnerableAccess drained");

  separator("B4 — Deploy FixedAccess (OpenZeppelin Ownable)");
  const FixedAccess = await ethers.getContractFactory("FixedAccess");
  const fixedAccess = await FixedAccess.deploy(deployer.address);
  await fixedAccess.waitForDeployment();
  const fixedAccessAddr = await fixedAccess.getAddress();
  console.log("FixedAccess:", fixedAccessAddr);

  // Owner deposits 3 ETH
  await (await fixedAccess.connect(deployer).deposit({ value: ethers.parseEther("3") })).wait();
  console.log("Owner deposited 3 ETH");
  console.log("Vault balance:", eth(await ethers.provider.getBalance(fixedAccessAddr)));

  separator("B5 — Attacker tries to withdraw from FixedAccess (should fail)");
  try {
    await fixedAccess.connect(attackerEOA).withdraw(attackerEOA.address);
    console.log("ERROR: should have reverted!");
  } catch {
    console.log("✓ FIX — withdraw() by non-owner reverted (onlyOwner guard)");
  }

  separator("B6 — Attacker tries to transfer ownership (should fail)");
  try {
    await fixedAccess.connect(attackerEOA).transferOwnership(attackerEOA.address);
    console.log("ERROR: should have reverted!");
  } catch {
    console.log("✓ FIX — transferOwnership() by non-owner reverted");
  }

  // Owner withdraws successfully
  await (await fixedAccess.connect(deployer).withdraw(deployer.address)).wait();
  const fixedBalAfter = await ethers.provider.getBalance(fixedAccessAddr);
  console.log("✓ Owner withdrew 3 ETH successfully. Vault balance:", eth(fixedBalAfter));

  // ─── Final security summary ────────────────────────────────────────────────
  separator("Security Summary");
  console.log(`
  ┌─────────────────────────────────────────────────────────┐
  │ Vulnerability A: Reentrancy                             │
  │   Root cause  : state update AFTER external call       │
  │   Impact      : full vault drain in 1 transaction      │
  │   Fix         : CEI pattern + ReentrancyGuard mutex    │
  ├─────────────────────────────────────────────────────────┤
  │ Vulnerability B: Access Control Misconfiguration        │
  │   Root cause  : missing onlyOwner on setOwner/withdraw  │
  │   Impact      : anyone can steal funds & ownership     │
  │   Fix         : OpenZeppelin Ownable + onlyOwner       │
  └─────────────────────────────────────────────────────────┘
  `);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
