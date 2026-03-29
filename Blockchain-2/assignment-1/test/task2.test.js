const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Task 2 – UUPS Proxy Pattern", function () {
  let proxy, owner, other;

  beforeEach(async function () {
    [owner, other] = await ethers.getSigners();
    const LogicV1 = await ethers.getContractFactory("LogicV1");
    proxy = await upgrades.deployProxy(LogicV1, [owner.address], {
      initializer: "initialize",
      kind: "uups",
    });
    await proxy.waitForDeployment();
  });

  it("V1: deploys with counter = 0 and version = V1", async function () {
    expect(await proxy.get()).to.equal(0n);
    expect(await proxy.version()).to.equal("V1");
  });

  it("V1: increment increases counter", async function () {
    await proxy.increment();
    await proxy.increment();
    expect(await proxy.get()).to.equal(2n);
  });

  it("V1: only owner can authorize upgrade", async function () {
    const LogicV2 = await ethers.getContractFactory("LogicV2", other);
    await expect(
      upgrades.upgradeProxy(proxy, LogicV2, {
        kind: "uups",
        call: { fn: "initializeV2" },
      })
    ).to.be.reverted;
  });

  it("upgrades to V2 and preserves counter state", async function () {
    // Increment counter in V1
    await proxy.increment();
    await proxy.increment();
    await proxy.increment();
    expect(await proxy.get()).to.equal(3n);

    // Upgrade to V2
    const LogicV2 = await ethers.getContractFactory("LogicV2");
    const proxyV2 = await upgrades.upgradeProxy(proxy, LogicV2, {
      kind: "uups",
      call: { fn: "initializeV2" },
    });
    await proxyV2.waitForDeployment();

    // Counter value preserved
    expect(await proxyV2.get()).to.equal(3n);
    expect(await proxyV2.version()).to.equal("V2");
  });

  it("V2: decrement and reset work correctly", async function () {
    // Increment in V1 then upgrade
    await proxy.increment();
    await proxy.increment();
    await proxy.increment();

    const LogicV2 = await ethers.getContractFactory("LogicV2");
    const proxyV2 = await upgrades.upgradeProxy(proxy, LogicV2, {
      kind: "uups",
      call: { fn: "initializeV2" },
    });
    await proxyV2.waitForDeployment();

    // Decrement (new V2 function)
    await proxyV2.decrement();
    expect(await proxyV2.get()).to.equal(2n);

    // Reset (new V2 function, owner only)
    await proxyV2.reset();
    expect(await proxyV2.get()).to.equal(0n);
  });

  it("V2: decrement reverts when counter is zero", async function () {
    const LogicV2 = await ethers.getContractFactory("LogicV2");
    const proxyV2 = await upgrades.upgradeProxy(proxy, LogicV2, {
      kind: "uups",
      call: { fn: "initializeV2" },
    });
    await proxyV2.waitForDeployment();

    await expect(proxyV2.decrement()).to.be.revertedWith("Counter is already zero");
  });

  it("V2: reset is restricted to owner", async function () {
    const LogicV2 = await ethers.getContractFactory("LogicV2");
    const proxyV2 = await upgrades.upgradeProxy(proxy, LogicV2, {
      kind: "uups",
      call: { fn: "initializeV2" },
    });
    await proxyV2.waitForDeployment();

    await proxy.increment();
    await expect(proxyV2.connect(other).reset()).to.be.reverted;
  });
});
