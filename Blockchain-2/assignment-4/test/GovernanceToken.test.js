const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("GovernanceToken", function () {
  let token, owner, alice, bob;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("GovernanceToken");
    token = await Token.deploy(owner.address);
  });

  it("mints initial supply of 1,000,000 GOV to recipient", async function () {
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1000000"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("1000000"));
  });

  it("uses timestamp clock mode", async function () {
    expect(await token.CLOCK_MODE()).to.equal("mode=timestamp");
    const now = await time.latest();
    expect(Number(await token.clock())).to.be.closeTo(now, 5);
  });

  it("voting power is zero before delegation", async function () {
    expect(await token.getVotes(owner.address)).to.equal(0n);
  });

  it("self-delegation activates voting power", async function () {
    await token.delegate(owner.address);
    expect(await token.getVotes(owner.address)).to.equal(ethers.parseEther("1000000"));
  });

  it("delegation transfers voting power to delegatee", async function () {
    await token.transfer(alice.address, ethers.parseEther("100"));
    await token.connect(alice).delegate(bob.address);
    expect(await token.getVotes(bob.address)).to.equal(ethers.parseEther("100"));
    expect(await token.getVotes(alice.address)).to.equal(0n);
  });

  it("transfers move voting power for the delegatee", async function () {
    await token.transfer(alice.address, ethers.parseEther("200"));
    await token.connect(alice).delegate(alice.address);
    expect(await token.getVotes(alice.address)).to.equal(ethers.parseEther("200"));
    await token.connect(alice).transfer(bob.address, ethers.parseEther("50"));
    expect(await token.getVotes(alice.address)).to.equal(ethers.parseEther("150"));
  });

  it("historical getPastVotes works at past timestamps", async function () {
    await token.delegate(owner.address);
    await time.increase(60);
    const snapshot = await time.latest();
    await time.increase(60);
    await token.transfer(alice.address, ethers.parseEther("400000"));
    expect(await token.getPastVotes(owner.address, snapshot)).to.equal(ethers.parseEther("1000000"));
    expect(await token.getVotes(owner.address)).to.equal(ethers.parseEther("600000"));
  });

  it("supports EIP-2612 permit (gasless approval)", async function () {
    const value = ethers.parseEther("123");
    const deadline = (await time.latest()) + 3600;
    const nonce = await token.nonces(owner.address);
    const domain = {
      name: "Governance Token",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await token.getAddress(),
    };
    const types = {
      Permit: [
        { name: "owner",    type: "address" },
        { name: "spender",  type: "address" },
        { name: "value",    type: "uint256" },
        { name: "nonce",    type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };
    const message = { owner: owner.address, spender: alice.address, value, nonce, deadline };
    const sig = await owner.signTypedData(domain, types, message);
    const { v, r, s } = ethers.Signature.from(sig);
    await token.permit(owner.address, alice.address, value, deadline, v, r, s);
    expect(await token.allowance(owner.address, alice.address)).to.equal(value);
  });
});
