const { expect } = require("chai");
const { ethers } = require("hardhat");

// ──────────────────────────────────────────────────────────────────────────────
// Vulnerability A: Reentrancy
// ──────────────────────────────────────────────────────────────────────────────
describe("Task 5A – Reentrancy: VulnerableVault exploit", function () {
  let vault, attacker, victim, attackerUser;

  beforeEach(async function () {
    [, victim, attackerUser] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("VulnerableVault");
    vault = await Vault.deploy();
    await vault.waitForDeployment();

    const Attacker = await ethers.getContractFactory("Attacker");
    attacker = await Attacker.connect(attackerUser).deploy(await vault.getAddress());
    await attacker.waitForDeployment();

    // Victim deposits 5 ETH into the vault (creates balance to steal)
    await vault.connect(victim).deposit({ value: ethers.parseEther("5") });
  });

  it("EXPLOIT: attacker drains VulnerableVault via reentrancy", async function () {
    const vaultBefore = await vault.getBalance();
    expect(vaultBefore).to.equal(ethers.parseEther("5"));

    // Attacker sends 1 ETH, then exploits reentrancy to steal 5 ETH total
    await attacker.connect(attackerUser).attack({ value: ethers.parseEther("1") });

    const vaultAfter = await vault.getBalance();
    console.log(`\n  Vault before: ${ethers.formatEther(vaultBefore)} ETH`);
    console.log(`  Vault after:  ${ethers.formatEther(vaultAfter)} ETH`);
    console.log(`  Stolen:       ${ethers.formatEther(vaultBefore - vaultAfter)} ETH`);

    // Vault should be drained (or significantly reduced)
    expect(vaultAfter).to.be.lessThan(vaultBefore);
  });
});

describe("Task 5A – Reentrancy: FixedVault exploit fails", function () {
  let vault, attacker, victim, attackerUser;

  beforeEach(async function () {
    [, victim, attackerUser] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("FixedVault");
    vault = await Vault.deploy();
    await vault.waitForDeployment();

    // We reuse the same Attacker contract targeting the fixed vault
    const Attacker = await ethers.getContractFactory("Attacker");
    attacker = await Attacker.connect(attackerUser).deploy(await vault.getAddress());
    await attacker.waitForDeployment();

    // Victim deposits 5 ETH
    await vault.connect(victim).deposit({ value: ethers.parseEther("5") });
  });

  it("FIX: reentrancy attack reverts on FixedVault", async function () {
    const vaultBefore = await vault.getBalance();
    expect(vaultBefore).to.equal(ethers.parseEther("5"));

    // Attack should revert due to ReentrancyGuard
    await expect(
      attacker.connect(attackerUser).attack({ value: ethers.parseEther("1") })
    ).to.be.reverted;

    // Vault balance unchanged
    const vaultAfter = await vault.getBalance();
    console.log(`\n  Vault balance preserved: ${ethers.formatEther(vaultAfter)} ETH`);
    expect(vaultAfter).to.equal(ethers.parseEther("5"));
  });

  it("FIX: normal deposit and withdraw work correctly", async function () {
    const [, , , user] = await ethers.getSigners();
    await vault.connect(user).deposit({ value: ethers.parseEther("1") });
    expect(await vault.balances(user.address)).to.equal(ethers.parseEther("1"));

    await vault.connect(user).withdraw();
    expect(await vault.balances(user.address)).to.equal(0n);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Vulnerability B: Access Control
// ──────────────────────────────────────────────────────────────────────────────
describe("Task 5B – Access Control: VulnerableAccess exploit", function () {
  let contract, owner, attacker;

  beforeEach(async function () {
    [owner, attacker] = await ethers.getSigners();
    const VulnerableAccess = await ethers.getContractFactory("VulnerableAccess");
    contract = await VulnerableAccess.deploy();
    await contract.waitForDeployment();

    // Owner deposits 3 ETH
    await contract.connect(owner).deposit({ value: ethers.parseEther("3") });
  });

  it("EXPLOIT: any address can call setOwner", async function () {
    const ownerBefore = await contract.owner();
    expect(ownerBefore).to.equal(owner.address);

    // Attacker hijacks ownership
    await contract.connect(attacker).setOwner(attacker.address);

    const ownerAfter = await contract.owner();
    expect(ownerAfter).to.equal(attacker.address);
    console.log(`\n  Owner changed from ${ownerBefore} to ${ownerAfter}`);
  });

  it("EXPLOIT: any address can call withdraw", async function () {
    const attackerBalanceBefore = await ethers.provider.getBalance(attacker.address);
    const vaultBalance = await ethers.provider.getBalance(await contract.getAddress());
    expect(vaultBalance).to.equal(ethers.parseEther("3"));

    // Attacker drains vault without being owner
    await contract.connect(attacker).withdraw(attacker.address);

    const vaultAfter = await ethers.provider.getBalance(await contract.getAddress());
    expect(vaultAfter).to.equal(0n);
    console.log(`\n  Vault drained by non-owner. Balance: ${ethers.formatEther(vaultAfter)} ETH`);
  });
});

describe("Task 5B – Access Control: FixedAccess exploit fails", function () {
  let contract, owner, attacker;

  beforeEach(async function () {
    [owner, attacker] = await ethers.getSigners();
    const FixedAccess = await ethers.getContractFactory("FixedAccess");
    contract = await FixedAccess.deploy(owner.address);
    await contract.waitForDeployment();

    // Owner deposits 3 ETH
    await contract.connect(owner).deposit({ value: ethers.parseEther("3") });
  });

  it("FIX: non-owner cannot call withdraw", async function () {
    await expect(
      contract.connect(attacker).withdraw(attacker.address)
    ).to.be.reverted;

    const vaultBalance = await ethers.provider.getBalance(await contract.getAddress());
    expect(vaultBalance).to.equal(ethers.parseEther("3"));
    console.log(`\n  Vault balance preserved: ${ethers.formatEther(vaultBalance)} ETH`);
  });

  it("FIX: non-owner cannot transfer ownership", async function () {
    await expect(
      contract.connect(attacker).transferOwnership(attacker.address)
    ).to.be.reverted;

    expect(await contract.owner()).to.equal(owner.address);
  });

  it("FIX: owner can withdraw successfully", async function () {
    const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
    await contract.connect(owner).withdraw(owner.address);
    const vaultAfter = await ethers.provider.getBalance(await contract.getAddress());
    expect(vaultAfter).to.equal(0n);
  });

  it("FIX: owner can transfer ownership to new address", async function () {
    await contract.connect(owner).transferOwnership(attacker.address);
    expect(await contract.owner()).to.equal(attacker.address);
  });
});
