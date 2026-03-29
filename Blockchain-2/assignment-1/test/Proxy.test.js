const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("UUPS Proxy Pattern Tests", function () {
  let logicV1, logicV2, proxy;
  let owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
  });

  describe("LogicV1 Deployment and Initialization", function () {
    beforeEach(async function () {
      const LogicV1 = await ethers.getContractFactory("LogicV1");
      proxy = await upgrades.deployProxy(LogicV1, [], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxy.waitForDeployment();
      logicV1 = proxy;
    });

    it("Should initialize with counter at 0", async function () {
      expect(await logicV1.counter()).to.equal(0);
    });

    it("Should increment counter", async function () {
      await logicV1.increment();
      expect(await logicV1.counter()).to.equal(1);

      await logicV1.increment();
      expect(await logicV1.counter()).to.equal(2);
    });

    it("Should return correct version", async function () {
      expect(await logicV1.getVersion()).to.equal("v1.0.0");
    });

    it("Should emit CounterIncremented event", async function () {
      await expect(logicV1.increment())
        .to.emit(logicV1, "CounterIncremented")
        .withArgs(1);
    });

    it("Should have correct owner", async function () {
      expect(await logicV1.owner()).to.equal(owner.address);
    });
  });

  describe("Upgrade to LogicV2", function () {
    beforeEach(async function () {
      const LogicV1 = await ethers.getContractFactory("LogicV1");
      proxy = await upgrades.deployProxy(LogicV1, [], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxy.waitForDeployment();
      logicV1 = proxy;

      // Increment counter before upgrade
      await logicV1.increment();
      await logicV1.increment();
      await logicV1.increment();
    });

    it("Should upgrade from V1 to V2 preserving state", async function () {
      const counterBeforeUpgrade = await logicV1.counter();
      expect(counterBeforeUpgrade).to.equal(3);

      // Upgrade to V2
      const LogicV2 = await ethers.getContractFactory("LogicV2");
      const upgraded = await upgrades.upgradeProxy(proxy, LogicV2);
      logicV2 = upgraded;

      // Verify state is preserved
      expect(await logicV2.counter()).to.equal(3);
      expect(await logicV2.getVersion()).to.equal("v2.0.0");
    });

    it("Should have new decrement functionality after upgrade", async function () {
      const LogicV2 = await ethers.getContractFactory("LogicV2");
      const upgraded = await upgrades.upgradeProxy(proxy, LogicV2);
      logicV2 = upgraded;

      // Test decrement
      await logicV2.decrement();
      expect(await logicV2.counter()).to.equal(2);

      await logicV2.decrement();
      expect(await logicV2.counter()).to.equal(1);
    });

    it("Should have reset functionality after upgrade", async function () {
      const LogicV2 = await ethers.getContractFactory("LogicV2");
      const upgraded = await upgrades.upgradeProxy(proxy, LogicV2);
      logicV2 = upgraded;

      expect(await logicV2.counter()).to.equal(3);

      await logicV2.reset();
      expect(await logicV2.counter()).to.equal(0);
    });

    it("Should emit events for new functions", async function () {
      const LogicV2 = await ethers.getContractFactory("LogicV2");
      const upgraded = await upgrades.upgradeProxy(proxy, LogicV2);
      logicV2 = upgraded;

      await expect(logicV2.decrement())
        .to.emit(logicV2, "CounterDecremented")
        .withArgs(2);

      await expect(logicV2.reset()).to.emit(logicV2, "CounterReset");
    });

    it("Should fail to decrement when counter is 0", async function () {
      const LogicV2 = await ethers.getContractFactory("LogicV2");
      const upgraded = await upgrades.upgradeProxy(proxy, LogicV2);
      logicV2 = upgraded;

      await logicV2.reset();

      await expect(logicV2.decrement()).to.be.revertedWith(
        "Counter is already 0"
      );
    });

    it("Should only allow owner to reset", async function () {
      const LogicV2 = await ethers.getContractFactory("LogicV2");
      const upgraded = await upgrades.upgradeProxy(proxy, LogicV2);
      logicV2 = upgraded;

      await expect(logicV2.connect(addr1).reset()).to.be.reverted;
    });

    it("Should only allow owner to upgrade", async function () {
      const LogicV2 = await ethers.getContractFactory("LogicV2");

      await expect(
        upgrades.upgradeProxy(proxy, LogicV2.connect(addr1))
      ).to.be.reverted;
    });
  });

  describe("State Persistence Verification", function () {
    it("Should maintain counter through multiple increments and upgrade", async function () {
      const LogicV1 = await ethers.getContractFactory("LogicV1");
      proxy = await upgrades.deployProxy(LogicV1, [], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxy.waitForDeployment();

      // Increment 5 times
      for (let i = 0; i < 5; i++) {
        await proxy.increment();
      }
      expect(await proxy.counter()).to.equal(5);

      // Upgrade to V2
      const LogicV2 = await ethers.getContractFactory("LogicV2");
      const upgraded = await upgrades.upgradeProxy(proxy, LogicV2);

      // Verify state
      expect(await upgraded.counter()).to.equal(5);

      // Use new functionality
      await upgraded.increment();
      await upgraded.increment();
      expect(await upgraded.counter()).to.equal(7);

      await upgraded.decrement();
      expect(await upgraded.counter()).to.equal(6);
    });
  });
});
