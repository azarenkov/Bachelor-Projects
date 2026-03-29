const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Task 1 – Factory Pattern", function () {
  let factory, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("Factory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();
  });

  it("deploys a ChildContract using CREATE and records its address", async function () {
    const tx = await factory.connect(owner).deployWithCreate("MyChild");
    const receipt = await tx.wait();

    const deployed = await factory.getDeployedContracts();
    expect(deployed.length).to.equal(1);

    const childAddr = deployed[0];
    expect(ethers.isAddress(childAddr)).to.be.true;

    const isDeployed = await factory.isDeployed(childAddr);
    expect(isDeployed).to.be.true;
  });

  it("deploys a ChildContract using CREATE2 with deterministic address", async function () {
    const salt = ethers.keccak256(ethers.toUtf8Bytes("salt1"));
    const name = "Create2Child";

    // Pre-compute expected address
    const predicted = await factory.connect(owner).computeCreate2Address(name, salt);

    const tx = await factory.connect(owner).deployWithCreate2(name, salt);
    await tx.wait();

    const deployed = await factory.getDeployedContracts();
    expect(deployed.length).to.equal(1);
    expect(deployed[0].toLowerCase()).to.equal(predicted.toLowerCase());
  });

  it("stores multiple deployed contracts", async function () {
    await factory.deployWithCreate("Child1");
    const salt = ethers.keccak256(ethers.toUtf8Bytes("salt2"));
    await factory.deployWithCreate2("Child2", salt);

    const deployed = await factory.getDeployedContracts();
    expect(deployed.length).to.equal(2);
    expect(await factory.getDeployedCount()).to.equal(2n);
  });

  it("deployed ChildContract has correct owner and name", async function () {
    await factory.connect(user).deployWithCreate("UserChild");
    const deployed = await factory.getDeployedContracts();
    const child = await ethers.getContractAt("ChildContract", deployed[0]);

    expect(await child.owner()).to.equal(user.address);
    expect(await child.name()).to.equal("UserChild");
  });

  it("CREATE vs CREATE2 gas comparison", async function () {
    const salt = ethers.keccak256(ethers.toUtf8Bytes("gasTest"));

    const tx1 = await factory.deployWithCreate("GasChild1");
    const r1 = await tx1.wait();
    const gasCreate = r1.gasUsed;

    const tx2 = await factory.deployWithCreate2("GasChild2", salt);
    const r2 = await tx2.wait();
    const gasCreate2 = r2.gasUsed;

    console.log(`\n  Gas Comparison Table:`);
    console.log(`  ┌─────────────────────┬───────────────┐`);
    console.log(`  │ Method              │ Gas Used      │`);
    console.log(`  ├─────────────────────┼───────────────┤`);
    console.log(`  │ CREATE              │ ${String(gasCreate).padEnd(13)} │`);
    console.log(`  │ CREATE2             │ ${String(gasCreate2).padEnd(13)} │`);
    console.log(`  │ Difference          │ ${String(gasCreate2 > gasCreate ? "+" : "")+(gasCreate2 - gasCreate)} │`);
    console.log(`  └─────────────────────┴───────────────┘`);

    // CREATE2 costs slightly more due to extra salt hashing
    expect(gasCreate).to.be.a("bigint");
    expect(gasCreate2).to.be.a("bigint");
  });
});
