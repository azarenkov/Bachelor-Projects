const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Task 4 – Inline Assembly (Yul)", function () {
  let contract, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const AssemblyOps = await ethers.getContractFactory("AssemblyOps");
    contract = await AssemblyOps.deploy();
    await contract.waitForDeployment();
  });

  // ── Assembly 1: caller() ────────────────────────────────────────────────────
  it("getCallerAssembly returns correct caller address", async function () {
    const result = await contract.connect(user).getCallerAssembly.staticCall();
    expect(result.toLowerCase()).to.equal(user.address.toLowerCase());
  });

  it("getCallerSolidity matches getCallerAssembly result", async function () {
    const asmResult = await contract.connect(user).getCallerAssembly.staticCall();
    const solResult = await contract.connect(user).getCallerSolidity.staticCall();
    expect(asmResult.toLowerCase()).to.equal(solResult.toLowerCase());
  });

  // ── Assembly 2: isPowerOfTwo ────────────────────────────────────────────────
  it("isPowerOfTwoAssembly correctly identifies powers of two", async function () {
    expect(await contract.isPowerOfTwoAssembly(1n)).to.equal(1n);
    expect(await contract.isPowerOfTwoAssembly(2n)).to.equal(1n);
    expect(await contract.isPowerOfTwoAssembly(4n)).to.equal(1n);
    expect(await contract.isPowerOfTwoAssembly(16n)).to.equal(1n);
    expect(await contract.isPowerOfTwoAssembly(1024n)).to.equal(1n);
  });

  it("isPowerOfTwoAssembly correctly rejects non-powers of two", async function () {
    expect(await contract.isPowerOfTwoAssembly(0n)).to.equal(0n);
    expect(await contract.isPowerOfTwoAssembly(3n)).to.equal(0n);
    expect(await contract.isPowerOfTwoAssembly(5n)).to.equal(0n);
    expect(await contract.isPowerOfTwoAssembly(100n)).to.equal(0n);
  });

  it("assembly and Solidity isPowerOfTwo agree on results", async function () {
    const testValues = [0n, 1n, 2n, 3n, 4n, 6n, 8n, 15n, 16n, 255n, 256n];
    for (const v of testValues) {
      const asm = await contract.isPowerOfTwoAssembly(v);
      const sol = await contract.isPowerOfTwoSolidity(v);
      // Assembly returns 0 or 1 (uint256); Solidity returns bool
      const asmBool = asm === 1n;
      expect(asmBool).to.equal(sol, `Mismatch for n=${v}`);
    }
  });

  // ── Assembly 3: sload/sstore ────────────────────────────────────────────────
  it("writeStorageAssembly stores and readStorageAssembly retrieves value", async function () {
    await contract.writeStorageAssembly(999n);
    const value = await contract.readStorageAssembly.staticCall();
    expect(value).to.equal(999n);
  });

  it("assembly and Solidity storage ops write to same slot", async function () {
    // Write via Solidity, read via assembly
    await contract.writeStorageSolidity(12345n);
    const value = await contract.readStorageAssembly.staticCall();
    expect(value).to.equal(12345n);

    // Write via assembly, read via Solidity
    await contract.writeStorageAssembly(67890n);
    const value2 = await contract.readStorageSolidity.staticCall();
    expect(value2).to.equal(67890n);
  });

  it("gas comparison: assembly vs Solidity operations", async function () {
    const tx1 = await contract.writeStorageSolidity(100n);
    const r1 = await tx1.wait();

    const tx2 = await contract.writeStorageAssembly(100n);
    const r2 = await tx2.wait();

    console.log(`\n  writeStorage Gas Comparison:`);
    console.log(`  ┌────────────────────────┬───────────────┐`);
    console.log(`  │ Function               │ Gas Used      │`);
    console.log(`  ├────────────────────────┼───────────────┤`);
    console.log(`  │ writeStorageSolidity   │ ${String(r1.gasUsed).padEnd(13)} │`);
    console.log(`  │ writeStorageAssembly   │ ${String(r2.gasUsed).padEnd(13)} │`);
    console.log(`  └────────────────────────┴───────────────┘`);

    // Assembly should use equal or fewer gas (within a small margin)
    expect(r1.gasUsed).to.be.a("bigint");
    expect(r2.gasUsed).to.be.a("bigint");
  });
});
