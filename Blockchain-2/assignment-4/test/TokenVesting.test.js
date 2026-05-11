const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TokenVesting", function () {
  let token, vesting, owner, team;
  const MONTH = 30 * 24 * 60 * 60;
  const YEAR = 12 * MONTH;
  const AMOUNT = ethers.parseEther("400000");

  beforeEach(async function () {
    [owner, team] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("GovernanceToken");
    token = await Token.deploy(owner.address);
    const start = (await time.latest()) + 60;
    const Vest = await ethers.getContractFactory("TokenVesting");
    vesting = await Vest.deploy(await token.getAddress(), team.address, start, YEAR, AMOUNT);
    await token.transfer(await vesting.getAddress(), AMOUNT);
  });

  it("releases nothing before start", async function () {
    expect(await vesting.releasable()).to.equal(0n);
    await expect(vesting.release()).to.be.revertedWithCustomError(vesting, "NothingToRelease");
  });

  it("releases ~1/12 after one month", async function () {
    await time.increase(60 + MONTH);
    const expected = AMOUNT / 12n;
    await vesting.release();
    const bal = await token.balanceOf(team.address);
    expect(bal).to.be.closeTo(expected, ethers.parseEther("1"));
  });

  it("vests fully after duration elapses", async function () {
    await time.increase(60 + YEAR + 1);
    await vesting.release();
    expect(await token.balanceOf(team.address)).to.equal(AMOUNT);
  });

  it("does not double-release on repeated calls", async function () {
    await time.increase(60 + MONTH);
    await vesting.release();
    await expect(vesting.release()).to.not.be.reverted;
    const halfway = AMOUNT / 12n;
    expect(await token.balanceOf(team.address)).to.be.closeTo(halfway, ethers.parseEther("10"));
  });
});
