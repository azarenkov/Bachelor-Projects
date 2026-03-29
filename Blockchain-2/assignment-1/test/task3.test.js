const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Task 3 – Gas Optimization", function () {
  let unopt, opt, owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    const Unopt = await ethers.getContractFactory("UnoptimizedStore");
    unopt = await Unopt.deploy();
    await unopt.waitForDeployment();

    const Opt = await ethers.getContractFactory("OptimizedStore");
    opt = await Opt.deploy(300, ethers.ZeroAddress);
    await opt.waitForDeployment();
  });

  it("both contracts correctly compute isPowerOfTwo", async function () {
    // Solidity unoptimized
    expect(await unopt.isPowerOfTwo(1n)).to.be.true;
    expect(await unopt.isPowerOfTwo(2n)).to.be.true;
    expect(await unopt.isPowerOfTwo(4n)).to.be.true;
    expect(await unopt.isPowerOfTwo(0n)).to.be.false;
    expect(await unopt.isPowerOfTwo(3n)).to.be.false;
    expect(await unopt.isPowerOfTwo(6n)).to.be.false;

    // Optimized bitwise
    expect(await opt.isPowerOfTwo(1n)).to.be.true;
    expect(await opt.isPowerOfTwo(2n)).to.be.true;
    expect(await opt.isPowerOfTwo(4n)).to.be.true;
    expect(await opt.isPowerOfTwo(0n)).to.be.false;
    expect(await opt.isPowerOfTwo(3n)).to.be.false;
    expect(await opt.isPowerOfTwo(6n)).to.be.false;
  });

  it("both contracts accumulate totalSupply correctly", async function () {
    const values = [1000n, 2000n, 3000n];

    // Unoptimized
    await unopt.addValues(values);
    const unoptTotal = await unopt.totalSupply();

    // Optimized (feeRate = 300 => 3%)
    await opt.addValues(values);
    const optTotal = await opt.totalSupply();

    // Both apply 3% fee, so net = value * 0.97
    const expectedTotal = values.reduce((acc, v) => acc + v - (v * 300n) / 10000n, 0n);
    expect(unoptTotal).to.equal(expectedTotal);
    expect(optTotal).to.equal(expectedTotal);
  });

  it("gas comparison: addValues unoptimized vs optimized", async function () {
    const values = [1000n, 2000n, 3000n, 4000n, 5000n];

    const tx1 = await unopt.addValues(values);
    const r1 = await tx1.wait();

    const tx2 = await opt.addValues(values);
    const r2 = await tx2.wait();

    console.log(`\n  addValues Gas Comparison:`);
    console.log(`  ┌──────────────────────┬───────────────┐`);
    console.log(`  │ Contract             │ Gas Used      │`);
    console.log(`  ├──────────────────────┼───────────────┤`);
    console.log(`  │ UnoptimizedStore     │ ${String(r1.gasUsed).padEnd(13)} │`);
    console.log(`  │ OptimizedStore       │ ${String(r2.gasUsed).padEnd(13)} │`);
    console.log(`  │ Savings              │ ${String(r1.gasUsed - r2.gasUsed).padEnd(13)} │`);
    console.log(`  └──────────────────────┴───────────────┘`);

    expect(r2.gasUsed).to.be.lessThan(r1.gasUsed);
  });

  it("optimized contract immutables are set correctly", async function () {
    expect(await opt.FEE_RATE()).to.equal(300n);
    expect(await opt.MAX_SUPPLY()).to.equal(1_000_000n * 10n ** 18n);
  });

  it("optimized contract rejects addValues when paused", async function () {
    await opt.pause();
    await expect(opt.addValues([100n])).to.be.revertedWith("Paused");
    await opt.unpause();
    await opt.addValues([100n]); // should succeed
  });
});
