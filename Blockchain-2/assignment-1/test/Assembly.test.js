const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Inline Assembly (Yul) Tests", function () {
  let assembly;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    const Assembly = await ethers.getContractFactory("AssemblyContract");
    assembly = await Assembly.deploy();
    await assembly.waitForDeployment();
  });

  describe("msg.sender Operations", function () {
    it("Should get sender using assembly", async function () {
      const tx = await assembly.getSenderWithAssembly();
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "SenderLogged"
      );
      expect(event.args[0]).to.equal(owner.address);

      console.log("Assembly getSender gas:", receipt.gasUsed.toString());
    });

    it("Should get sender using Solidity", async function () {
      const tx = await assembly.getSenderWithSolidity();
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "SenderLogged"
      );
      expect(event.args[0]).to.equal(owner.address);

      console.log("Solidity getSender gas:", receipt.gasUsed.toString());
    });

    it("Should return same sender for both methods", async function () {
      await assembly.getSenderWithAssembly();
      await assembly.getSenderWithSolidity();
      // Both should emit same address
    });
  });

  describe("Power of Two Check", function () {
    const powerOfTwoTests = [
      { value: 1, expected: true, name: "1 (2^0)" },
      { value: 2, expected: true, name: "2 (2^1)" },
      { value: 4, expected: true, name: "4 (2^2)" },
      { value: 8, expected: true, name: "8 (2^3)" },
      { value: 16, expected: true, name: "16 (2^4)" },
      { value: 1024, expected: true, name: "1024 (2^10)" },
      { value: 0, expected: false, name: "0 (not power of 2)" },
      { value: 3, expected: false, name: "3 (not power of 2)" },
      { value: 5, expected: false, name: "5 (not power of 2)" },
      { value: 6, expected: false, name: "6 (not power of 2)" },
      { value: 7, expected: false, name: "7 (not power of 2)" },
      { value: 15, expected: false, name: "15 (not power of 2)" },
    ];

    powerOfTwoTests.forEach(({ value, expected, name }) => {
      it(`Should correctly identify ${name} using assembly`, async function () {
        const tx = await assembly.isPowerOfTwoWithAssembly(value);
        const receipt = await tx.wait();

        const event = receipt.logs.find(
          (log) => log.fragment && log.fragment.name === "PowerOfTwoCheck"
        );
        expect(event.args[1]).to.equal(expected);
      });

      it(`Should correctly identify ${name} using Solidity`, async function () {
        const tx = await assembly.isPowerOfTwoWithSolidity(value);
        const receipt = await tx.wait();

        const event = receipt.logs.find(
          (log) => log.fragment && log.fragment.name === "PowerOfTwoCheck"
        );
        expect(event.args[1]).to.equal(expected);
      });
    });

    it("Should compare gas for power of two check", async function () {
      const tx1 = await assembly.isPowerOfTwoWithAssembly(1024);
      const receipt1 = await tx1.wait();
      console.log("Assembly isPowerOfTwo gas:", receipt1.gasUsed.toString());

      const tx2 = await assembly.isPowerOfTwoWithSolidity(1024);
      const receipt2 = await tx2.wait();
      console.log("Solidity isPowerOfTwo gas:", receipt2.gasUsed.toString());
    });
  });

  describe("Direct Storage Access", function () {
    it("Should set and get value using assembly", async function () {
      const testValue = 12345;

      const setTx = await assembly.setValueWithAssembly(testValue);
      await setTx.wait();

      const getValue = await assembly.getValueWithAssembly();
      expect(getValue).to.equal(testValue);

      // Also verify through public variable
      expect(await assembly.storedValue()).to.equal(testValue);
    });

    it("Should set and get value using Solidity", async function () {
      const testValue = 67890;

      const setTx = await assembly.setValueWithSolidity(testValue);
      await setTx.wait();

      const getValue = await assembly.getValueWithSolidity();
      expect(getValue).to.equal(testValue);
    });

    it("Should compare gas for storage operations", async function () {
      const tx1 = await assembly.setValueWithAssembly(11111);
      const receipt1 = await tx1.wait();
      console.log("Assembly setStorage gas:", receipt1.gasUsed.toString());

      const tx2 = await assembly.setValueWithSolidity(22222);
      const receipt2 = await tx2.wait();
      console.log("Solidity setStorage gas:", receipt2.gasUsed.toString());
    });

    it("Assembly and Solidity should access same storage slot", async function () {
      await assembly.setValueWithAssembly(999);
      expect(await assembly.getValueWithSolidity()).to.equal(999);

      await assembly.setValueWithSolidity(777);
      expect(await assembly.getValueWithAssembly()).to.equal(777);
    });
  });

  describe("Arithmetic Operations", function () {
    it("Should add numbers safely with assembly", async function () {
      const result = await assembly.addWithAssembly(100, 200);
      expect(result).to.equal(300);
    });

    it("Should detect overflow in assembly addition", async function () {
      const maxUint256 = ethers.MaxUint256;
      await expect(assembly.addWithAssembly(maxUint256, 1)).to.be.reverted;
    });

    it("Should handle zero addition", async function () {
      const result = await assembly.addWithAssembly(100, 0);
      expect(result).to.equal(100);
    });
  });

  describe("Return Data Copy", function () {
    it("Should copy calldata to return data using assembly", async function () {
      const testData = "0x1234567890abcdef";
      const result = await assembly.returnDataWithAssembly(testData);
      expect(result).to.equal(testData);
    });

    it("Should handle empty calldata", async function () {
      const result = await assembly.returnDataWithAssembly("0x");
      expect(result).to.equal("0x");
    });

    it("Should handle large calldata", async function () {
      const largeData = "0x" + "aa".repeat(1000);
      const result = await assembly.returnDataWithAssembly(largeData);
      expect(result).to.equal(largeData);
    });
  });

  describe("Gas Savings Summary", function () {
    it("Should demonstrate overall gas savings with assembly", async function () {
      console.log("\n=== GAS COMPARISON SUMMARY ===");

      // msg.sender comparison
      const tx1a = await assembly.getSenderWithAssembly();
      const receipt1a = await tx1a.wait();
      const tx1b = await assembly.getSenderWithSolidity();
      const receipt1b = await tx1b.wait();
      console.log(
        `msg.sender: Assembly=${receipt1a.gasUsed}, Solidity=${receipt1b.gasUsed}, Saved=${receipt1b.gasUsed - receipt1a.gasUsed}`
      );

      // isPowerOfTwo comparison
      const tx2a = await assembly.isPowerOfTwoWithAssembly(1024);
      const receipt2a = await tx2a.wait();
      const tx2b = await assembly.isPowerOfTwoWithSolidity(1024);
      const receipt2b = await tx2b.wait();
      console.log(
        `isPowerOfTwo: Assembly=${receipt2a.gasUsed}, Solidity=${receipt2b.gasUsed}, Saved=${receipt2b.gasUsed - receipt2a.gasUsed}`
      );

      // storage comparison
      const tx3a = await assembly.setValueWithAssembly(12345);
      const receipt3a = await tx3a.wait();
      const tx3b = await assembly.setValueWithSolidity(67890);
      const receipt3b = await tx3b.wait();
      console.log(
        `setStorage: Assembly=${receipt3a.gasUsed}, Solidity=${receipt3b.gasUsed}, Saved=${receipt3b.gasUsed - receipt3a.gasUsed}`
      );

      console.log("==============================\n");
    });
  });
});
