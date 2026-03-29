const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Security Vulnerability Tests", function () {
  describe("Reentrancy Attack", function () {
    let vulnerableVault, attacker, fixedVault;
    let owner, user1, user2;

    beforeEach(async function () {
      [owner, user1, user2] = await ethers.getSigners();

      // Deploy vulnerable vault
      const VulnerableVault = await ethers.getContractFactory("VulnerableVault");
      vulnerableVault = await VulnerableVault.deploy();
      await vulnerableVault.waitForDeployment();

      // Deploy attacker contract
      const Attacker = await ethers.getContractFactory("Attacker");
      attacker = await Attacker.deploy(await vulnerableVault.getAddress());
      await attacker.waitForDeployment();

      // Deploy fixed vault
      const FixedVault = await ethers.getContractFactory("FixedVault");
      fixedVault = await FixedVault.deploy();
      await fixedVault.waitForDeployment();
    });

    describe("Vulnerable Vault - Exploit Demonstration", function () {
      it("Should allow normal deposits and withdrawals", async function () {
        // User1 deposits
        await vulnerableVault.connect(user1).deposit({ value: ethers.parseEther("2") });
        expect(await vulnerableVault.balances(user1.address)).to.equal(
          ethers.parseEther("2")
        );

        // User1 withdraws
        const balanceBefore = await ethers.provider.getBalance(user1.address);
        await vulnerableVault.connect(user1).withdraw();
        const balanceAfter = await ethers.provider.getBalance(user1.address);

        expect(await vulnerableVault.balances(user1.address)).to.equal(0);
        expect(balanceAfter).to.be.gt(balanceBefore);
      });

      it("Should demonstrate successful reentrancy attack", async function () {
        // Setup: Multiple users deposit funds
        await vulnerableVault.connect(user1).deposit({ value: ethers.parseEther("3") });
        await vulnerableVault.connect(user2).deposit({ value: ethers.parseEther("3") });

        const vaultBalanceBefore = await vulnerableVault.getBalance();
        console.log("Vault balance before attack:", ethers.formatEther(vaultBalanceBefore), "ETH");

        // Attacker deposits and initiates attack
        const attackAmount = ethers.parseEther("1");
        await attacker.attack({ value: attackAmount });

        const vaultBalanceAfter = await vulnerableVault.getBalance();
        const attackerBalance = await attacker.getBalance();

        console.log("Vault balance after attack:", ethers.formatEther(vaultBalanceAfter), "ETH");
        console.log("Attacker balance:", ethers.formatEther(attackerBalance), "ETH");

        // Verify the attack was successful - attacker stole more than deposited
        expect(attackerBalance).to.be.gt(attackAmount);
        expect(vaultBalanceAfter).to.be.lt(vaultBalanceBefore);
      });

      it("Should show multiple reentrancy calls", async function () {
        await vulnerableVault.connect(user1).deposit({ value: ethers.parseEther("5") });

        const tx = await attacker.attack({ value: ethers.parseEther("1") });
        const receipt = await tx.wait();

        // Count ReentrancyExecuted events
        const reentrancyEvents = receipt.logs.filter(
          (log) => log.fragment && log.fragment.name === "ReentrancyExecuted"
        );

        console.log("Number of reentrancy calls:", reentrancyEvents.length);
        expect(reentrancyEvents.length).to.be.gt(1);
      });
    });

    describe("Fixed Vault - Attack Prevention", function () {
      it("Should allow normal deposits and withdrawals", async function () {
        await fixedVault.connect(user1).deposit({ value: ethers.parseEther("2") });
        expect(await fixedVault.balances(user1.address)).to.equal(
          ethers.parseEther("2")
        );

        await fixedVault.connect(user1).withdraw();
        expect(await fixedVault.balances(user1.address)).to.equal(0);
      });

      it("Should prevent reentrancy attack on fixed vault", async function () {
        // Deploy new attacker targeting fixed vault
        const AttackerFixed = await ethers.getContractFactory("Attacker");
        const attackerFixed = await AttackerFixed.deploy(await fixedVault.getAddress());
        await attackerFixed.waitForDeployment();

        // Setup: Users deposit funds
        await fixedVault.connect(user1).deposit({ value: ethers.parseEther("3") });
        await fixedVault.connect(user2).deposit({ value: ethers.parseEther("3") });

        const vaultBalanceBefore = await fixedVault.getBalance();

        // Attacker attempts attack - should fail
        await expect(
          attackerFixed.attack({ value: ethers.parseEther("1") })
        ).to.be.reverted;

        // Vault balance should remain intact
        const vaultBalanceAfter = await fixedVault.getBalance();
        expect(vaultBalanceAfter).to.be.gte(vaultBalanceBefore);
      });

      it("Should demonstrate Checks-Effects-Interactions pattern", async function () {
        await fixedVault.connect(user1).deposit({ value: ethers.parseEther("1") });

        // The balance should be set to 0 before the external call
        // This prevents reentrancy because subsequent calls will fail the balance check
        await fixedVault.connect(user1).withdraw();

        expect(await fixedVault.balances(user1.address)).to.equal(0);
      });
    });
  });

  describe("Access Control Vulnerabilities", function () {
    let vulnerableAccess, fixedAccess;
    let owner, attacker, user1;

    beforeEach(async function () {
      [owner, attacker, user1] = await ethers.getSigners();

      const VulnerableAccess = await ethers.getContractFactory("VulnerableAccess");
      vulnerableAccess = await VulnerableAccess.deploy();
      await vulnerableAccess.waitForDeployment();

      const FixedAccess = await ethers.getContractFactory("FixedAccess");
      fixedAccess = await FixedAccess.deploy();
      await fixedAccess.waitForDeployment();
    });

    describe("Vulnerable Access - Exploit Demonstration", function () {
      it("Should allow anyone to change owner", async function () {
        expect(await vulnerableAccess.owner()).to.equal(owner.address);

        // Attacker can become owner!
        await vulnerableAccess.connect(attacker).setOwner(attacker.address);
        expect(await vulnerableAccess.owner()).to.equal(attacker.address);

        console.log("Original owner:", owner.address);
        console.log("Attacker successfully became owner:", attacker.address);
      });

      it("Should allow anyone to withdraw funds", async function () {
        // Owner deposits funds
        await vulnerableAccess.connect(owner).deposit({ value: ethers.parseEther("5") });

        const vaultBalance = await vulnerableAccess.getBalance();
        expect(vaultBalance).to.equal(ethers.parseEther("5"));

        // Attacker can steal all funds!
        const attackerBalanceBefore = await ethers.provider.getBalance(attacker.address);
        await vulnerableAccess.connect(attacker).withdraw();

        expect(await vulnerableAccess.getBalance()).to.equal(0);
        const attackerBalanceAfter = await ethers.provider.getBalance(attacker.address);

        console.log("Funds stolen by attacker:", ethers.formatEther(attackerBalanceAfter - attackerBalanceBefore), "ETH");
        expect(attackerBalanceAfter).to.be.gt(attackerBalanceBefore);
      });

      it("Should allow anyone to add authorized users", async function () {
        // Attacker can add themselves as authorized
        await vulnerableAccess.connect(attacker).addAuthorizedUser(attacker.address);
        expect(await vulnerableAccess.authorizedUsers(attacker.address)).to.be.true;
      });
    });

    describe("Fixed Access - Protection Verification", function () {
      it("Should only allow owner to transfer ownership", async function () {
        expect(await fixedAccess.owner()).to.equal(owner.address);

        // Attacker cannot become owner
        await expect(
          fixedAccess.connect(attacker).transferOwnershipSecure(attacker.address)
        ).to.be.reverted;

        // Owner can transfer ownership
        await fixedAccess.connect(owner).transferOwnershipSecure(user1.address);
        expect(await fixedAccess.owner()).to.equal(user1.address);
      });

      it("Should only allow WITHDRAWER_ROLE to withdraw", async function () {
        await fixedAccess.connect(owner).deposit({ value: ethers.parseEther("5") });

        // Attacker without role cannot withdraw
        await expect(fixedAccess.connect(attacker).withdraw()).to.be.reverted;

        // Owner with WITHDRAWER_ROLE can withdraw
        await fixedAccess.connect(owner).withdraw();
        expect(await fixedAccess.getBalance()).to.equal(0);
      });

      it("Should only allow ADMIN_ROLE to grant roles", async function () {
        const WITHDRAWER_ROLE = await fixedAccess.WITHDRAWER_ROLE();

        // Attacker cannot grant roles
        await expect(
          fixedAccess.connect(attacker).addAuthorizedUser(attacker.address, WITHDRAWER_ROLE)
        ).to.be.reverted;

        // Admin can grant roles
        await fixedAccess.connect(owner).addAuthorizedUser(user1.address, WITHDRAWER_ROLE);
        expect(await fixedAccess.hasRole(WITHDRAWER_ROLE, user1.address)).to.be.true;
      });

      it("Should allow authorized user to withdraw after role granted", async function () {
        await fixedAccess.connect(owner).deposit({ value: ethers.parseEther("3") });

        const WITHDRAWER_ROLE = await fixedAccess.WITHDRAWER_ROLE();
        await fixedAccess.connect(owner).addAuthorizedUser(user1.address, WITHDRAWER_ROLE);

        // Now user1 can withdraw
        await expect(fixedAccess.connect(user1).withdraw()).to.not.be.reverted;
      });

      it("Should have emergency withdraw only for owner", async function () {
        await fixedAccess.connect(owner).deposit({ value: ethers.parseEther("2") });

        // Attacker cannot emergency withdraw
        await expect(fixedAccess.connect(attacker).emergencyWithdraw()).to.be.reverted;

        // Owner can emergency withdraw
        await fixedAccess.connect(owner).emergencyWithdraw();
        expect(await fixedAccess.getBalance()).to.equal(0);
      });
    });

    describe("Role-Based Access Control", function () {
      it("Should verify multiple roles", async function () {
        const ADMIN_ROLE = await fixedAccess.ADMIN_ROLE();
        const WITHDRAWER_ROLE = await fixedAccess.WITHDRAWER_ROLE();
        const DEFAULT_ADMIN_ROLE = await fixedAccess.DEFAULT_ADMIN_ROLE();

        // Owner should have all roles
        expect(await fixedAccess.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
        expect(await fixedAccess.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
        expect(await fixedAccess.hasRole(WITHDRAWER_ROLE, owner.address)).to.be.true;

        // Others should have no roles
        expect(await fixedAccess.hasRole(ADMIN_ROLE, attacker.address)).to.be.false;
      });
    });
  });
});
