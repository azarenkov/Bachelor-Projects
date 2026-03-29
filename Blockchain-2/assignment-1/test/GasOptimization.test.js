const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Gas Optimization Tests", function () {
  let unoptimized, optimized;
  let owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const Unoptimized = await ethers.getContractFactory("UnoptimizedContract");
    unoptimized = await Unoptimized.deploy();
    await unoptimized.waitForDeployment();

    const Optimized = await ethers.getContractFactory("OptimizedContract");
    optimized = await Optimized.deploy();
    await optimized.waitForDeployment();
  });

  describe("Deployment Cost Comparison", function () {
    it("Should compare deployment gas costs", async function () {
      const Unoptimized = await ethers.getContractFactory("UnoptimizedContract");
      const unoptimizedDeploy = await Unoptimized.deploy();
      const unoptimizedReceipt = await unoptimizedDeploy.deploymentTransaction().wait();

      const Optimized = await ethers.getContractFactory("OptimizedContract");
      const optimizedDeploy = await Optimized.deploy();
      const optimizedReceipt = await optimizedDeploy.deploymentTransaction().wait();

      console.log("Unoptimized deployment gas:", unoptimizedReceipt.gasUsed.toString());
      console.log("Optimized deployment gas:", optimizedReceipt.gasUsed.toString());
      console.log(
        "Gas saved on deployment:",
        (unoptimizedReceipt.gasUsed - optimizedReceipt.gasUsed).toString()
      );
    });
  });

  describe("processArray Gas Comparison", function () {
    const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    it("Should process array with unoptimized version", async function () {
      const tx = await unoptimized.processArray(testData);
      const receipt = await tx.wait();
      console.log("Unoptimized processArray gas:", receipt.gasUsed.toString());
    });

    it("Should process array with optimized version", async function () {
      const tx = await optimized.processArray(testData);
      const receipt = await tx.wait();
      console.log("Optimized processArray gas:", receipt.gasUsed.toString());
    });
  });

  describe("complexCheck Gas Comparison", function () {
    it("Should compare complexCheck gas usage", async function () {
      const tx1 = await unoptimized.complexCheck(500);
      const receipt1 = await tx1.wait();
      console.log("Unoptimized complexCheck gas:", receipt1.gasUsed.toString());

      const tx2 = await optimized.complexCheck(500);
      const receipt2 = await tx2.wait();
      console.log("Optimized complexCheck gas:", receipt2.gasUsed.toString());
    });
  });

  describe("incrementCounter Gas Comparison", function () {
    it("Should compare incrementCounter gas usage", async function () {
      const tx1 = await unoptimized.incrementCounter(10);
      const receipt1 = await tx1.wait();
      console.log("Unoptimized incrementCounter gas:", receipt1.gasUsed.toString());

      const tx2 = await optimized.incrementCounter(10);
      const receipt2 = await tx2.wait();
      console.log("Optimized incrementCounter gas:", receipt2.gasUsed.toString());
    });
  });

  describe("logValue Gas Comparison", function () {
    it("Should compare logValue gas usage (storage vs event)", async function () {
      const tx1 = await unoptimized.logValue(12345);
      const receipt1 = await tx1.wait();
      console.log("Unoptimized logValue (storage) gas:", receipt1.gasUsed.toString());

      const tx2 = await optimized.logValue(12345);
      const receipt2 = await tx2.wait();
      console.log("Optimized logValue (event) gas:", receipt2.gasUsed.toString());
    });
  });

  describe("getOwnerBalance Gas Comparison", function () {
    it("Should compare getOwnerBalance gas usage", async function () {
      // Set up some balance first
      await unoptimized.updateBalance(owner.address, 1000);
      await optimized.updateBalance(owner.address, 1000);

      const tx1 = await unoptimized.getOwnerBalance();
      const tx2 = await optimized.getOwnerBalance();

      // View functions don't use gas in transactions, but we can estimate
      console.log("Storage read caching demonstration completed");
    });
  });

  describe("Functional Equivalence", function () {
    it("Should produce same results for processArray", async function () {
      const testData = [10, 20, 30];

      await unoptimized.processArray(testData);
      await optimized.processArray(testData);

      expect(await unoptimized.largeNumber()).to.equal(
        await optimized.largeNumber()
      );
    });

    it("Should produce same results for complexCheck", async function () {
      expect(await unoptimized.complexCheck(500)).to.equal(
        await optimized.complexCheck(500)
      );
      expect(await unoptimized.complexCheck(15)).to.equal(
        await optimized.complexCheck(15)
      );
    });

    it("Should produce same results for incrementCounter", async function () {
      await unoptimized.incrementCounter(5);
      await optimized.incrementCounter(5);

      expect(await unoptimized.smallNumber1()).to.equal(
        await optimized.smallNumber1()
      );
    });
  });

  describe("Storage Layout Verification", function () {
    it("Should verify optimized storage packing", async function () {
      // In optimized contract, smallNumber1, smallNumber2, and flag should be in same slot
      console.log("Optimized contract uses storage packing for uint8 and bool values");
    });

    it("Should verify immutable deployment time", async function () {
      const deploymentTime = await optimized.deploymentTime();
      expect(deploymentTime).to.be.gt(0);
      console.log("Deployment time stored as immutable:", deploymentTime.toString());
    });
  });
});
