const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const VOTING_DELAY = 1 * 24 * 60 * 60;
const VOTING_PERIOD = 7 * 24 * 60 * 60;
const TIMELOCK_DELAY = 2 * 24 * 60 * 60;

const VOTE_AGAINST = 0;
const VOTE_FOR = 1;
const VOTE_ABSTAIN = 2;

const STATE = {
  Pending: 0,
  Active: 1,
  Canceled: 2,
  Defeated: 3,
  Succeeded: 4,
  Queued: 5,
  Expired: 6,
  Executed: 7,
};

async function deployStack() {
  const [deployer, voter1, voter2, voter3, recipient] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("GovernanceToken");
  const token = await Token.deploy(deployer.address);

  const Timelock = await ethers.getContractFactory("TimelockController");
  const timelock = await Timelock.deploy(TIMELOCK_DELAY, [], [], deployer.address);

  const Governor = await ethers.getContractFactory("MyGovernor");
  const governor = await Governor.deploy(await token.getAddress(), await timelock.getAddress());

  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  const DEFAULT_ADMIN_ROLE = await timelock.DEFAULT_ADMIN_ROLE();

  await timelock.grantRole(PROPOSER_ROLE, await governor.getAddress());
  await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress);
  await timelock.renounceRole(DEFAULT_ADMIN_ROLE, deployer.address);

  const Box = await ethers.getContractFactory("Box");
  const box = await Box.deploy(await timelock.getAddress());

  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(await timelock.getAddress());

  await token.transfer(voter1.address, ethers.parseEther("250000"));
  await token.transfer(voter2.address, ethers.parseEther("250000"));
  await token.transfer(voter3.address, ethers.parseEther("200000"));
  await token.transfer(await treasury.getAddress(), ethers.parseEther("100000"));

  await token.connect(voter1).delegate(voter1.address);
  await token.connect(voter2).delegate(voter2.address);
  await token.connect(voter3).delegate(voter3.address);
  await time.increase(2);

  return { deployer, voter1, voter2, voter3, recipient, token, timelock, governor, box, treasury };
}

async function propose(governor, proposer, targets, values, calldatas, description) {
  const tx = await governor
    .connect(proposer)
    .propose(targets, values, calldatas, description);
  const receipt = await tx.wait();
  const ev = receipt.logs.find((l) => l.fragment && l.fragment.name === "ProposalCreated");
  return ev.args.proposalId;
}

describe("Governance lifecycle", function () {
  let ctx;
  beforeEach(async function () {
    ctx = await deployStack();
  });

  it("Governor reports voting delay=1d, period=7d, threshold>0, quorum=4%", async function () {
    expect(await ctx.governor.votingDelay()).to.equal(VOTING_DELAY);
    expect(await ctx.governor.votingPeriod()).to.equal(VOTING_PERIOD);
    expect(await ctx.governor.proposalThreshold()).to.equal(ethers.parseEther("10000"));
    const total = await ctx.token.getPastTotalSupply((await time.latest()) - 1);
    expect(await ctx.governor.quorum(((await time.latest()) - 1))).to.equal(total * 4n / 100n);
  });

  it("Timelock recognises Governor as the only proposer", async function () {
    const PROPOSER = await ctx.timelock.PROPOSER_ROLE();
    expect(await ctx.timelock.hasRole(PROPOSER, await ctx.governor.getAddress())).to.equal(true);
  });

  it("Box and Treasury are owned by the Timelock", async function () {
    const tlAddr = await ctx.timelock.getAddress();
    expect(await ctx.box.owner()).to.equal(tlAddr);
    expect(await ctx.treasury.owner()).to.equal(tlAddr);
  });

  it("Proposal under threshold reverts on propose()", async function () {
    const [, , , , poor] = await ethers.getSigners();
    const targets = [await ctx.box.getAddress()];
    const values = [0];
    const calldatas = [ctx.box.interface.encodeFunctionData("store", [1])];
    await expect(
      ctx.governor.connect(poor).propose(targets, values, calldatas, "no power")
    ).to.be.revertedWithCustomError(ctx.governor, "GovernorInsufficientProposerVotes");
  });

  it("End-to-end: propose -> vote -> queue -> execute Box.store(42)", async function () {
    const targets = [await ctx.box.getAddress()];
    const values = [0];
    const calldatas = [ctx.box.interface.encodeFunctionData("store", [42])];
    const description = "Set box to 42";
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));

    const id = await propose(ctx.governor, ctx.voter1, targets, values, calldatas, description);
    expect(await ctx.governor.state(id)).to.equal(STATE.Pending);

    await time.increase(VOTING_DELAY + 1);
    expect(await ctx.governor.state(id)).to.equal(STATE.Active);

    await ctx.governor.connect(ctx.voter1).castVote(id, VOTE_FOR);
    await ctx.governor.connect(ctx.voter2).castVote(id, VOTE_FOR);
    await ctx.governor.connect(ctx.voter3).castVote(id, VOTE_AGAINST);

    await time.increase(VOTING_PERIOD + 1);
    expect(await ctx.governor.state(id)).to.equal(STATE.Succeeded);

    await ctx.governor.queue(targets, values, calldatas, descriptionHash);
    expect(await ctx.governor.state(id)).to.equal(STATE.Queued);

    await time.increase(TIMELOCK_DELAY + 1);
    await ctx.governor.execute(targets, values, calldatas, descriptionHash);
    expect(await ctx.governor.state(id)).to.equal(STATE.Executed);
    expect(await ctx.box.retrieve()).to.equal(42n);
  });

  it("Proposal can change a parameter on another contract (Box.setFeeBps)", async function () {
    const targets = [await ctx.box.getAddress()];
    const values = [0];
    const calldatas = [ctx.box.interface.encodeFunctionData("setFeeBps", [125])];
    const description = "Bump fee to 1.25%";
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
    const id = await propose(ctx.governor, ctx.voter1, targets, values, calldatas, description);

    await time.increase(VOTING_DELAY + 1);
    await ctx.governor.connect(ctx.voter1).castVote(id, VOTE_FOR);
    await ctx.governor.connect(ctx.voter2).castVote(id, VOTE_FOR);
    await time.increase(VOTING_PERIOD + 1);
    await ctx.governor.queue(targets, values, calldatas, descriptionHash);
    await time.increase(TIMELOCK_DELAY + 1);
    await ctx.governor.execute(targets, values, calldatas, descriptionHash);

    expect(await ctx.box.feeBps()).to.equal(125n);
  });

  it("Proposal can transfer tokens from the treasury", async function () {
    const treasuryAddr = await ctx.treasury.getAddress();
    const amount = ethers.parseEther("5000");
    const targets = [treasuryAddr];
    const values = [0];
    const calldatas = [
      ctx.treasury.interface.encodeFunctionData("sendToken", [
        await ctx.token.getAddress(),
        ctx.recipient.address,
        amount,
      ]),
    ];
    const description = "Pay grant from treasury";
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));

    const before = await ctx.token.balanceOf(ctx.recipient.address);
    const id = await propose(ctx.governor, ctx.voter1, targets, values, calldatas, description);

    await time.increase(VOTING_DELAY + 1);
    await ctx.governor.connect(ctx.voter1).castVote(id, VOTE_FOR);
    await ctx.governor.connect(ctx.voter2).castVote(id, VOTE_FOR);
    await time.increase(VOTING_PERIOD + 1);
    await ctx.governor.queue(targets, values, calldatas, descriptionHash);
    await time.increase(TIMELOCK_DELAY + 1);
    await ctx.governor.execute(targets, values, calldatas, descriptionHash);

    expect(await ctx.token.balanceOf(ctx.recipient.address)).to.equal(before + amount);
  });

  it("Defeated when quorum not met", async function () {
    const targets = [await ctx.box.getAddress()];
    const values = [0];
    const calldatas = [ctx.box.interface.encodeFunctionData("store", [777])];
    const description = "Defeated: no quorum";
    const id = await propose(ctx.governor, ctx.voter1, targets, values, calldatas, description);

    await time.increase(VOTING_DELAY + 1);
    await time.increase(VOTING_PERIOD + 1);
    expect(await ctx.governor.state(id)).to.equal(STATE.Defeated);
  });

  it("Defeated when more Against than For", async function () {
    const targets = [await ctx.box.getAddress()];
    const values = [0];
    const calldatas = [ctx.box.interface.encodeFunctionData("store", [777])];
    const description = "Defeated: against majority";
    const id = await propose(ctx.governor, ctx.voter1, targets, values, calldatas, description);

    await time.increase(VOTING_DELAY + 1);
    await ctx.governor.connect(ctx.voter1).castVote(id, VOTE_FOR);
    await ctx.governor.connect(ctx.voter2).castVote(id, VOTE_AGAINST);
    await ctx.governor.connect(ctx.voter3).castVote(id, VOTE_AGAINST);
    await time.increase(VOTING_PERIOD + 1);

    expect(await ctx.governor.state(id)).to.equal(STATE.Defeated);
  });

  it("Abstain counts toward quorum but does not flip outcome", async function () {
    const targets = [await ctx.box.getAddress()];
    const values = [0];
    const calldatas = [ctx.box.interface.encodeFunctionData("store", [11])];
    const description = "Quorum from abstain";
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
    const id = await propose(ctx.governor, ctx.voter1, targets, values, calldatas, description);

    await time.increase(VOTING_DELAY + 1);
    await ctx.governor.connect(ctx.voter1).castVote(id, VOTE_FOR);
    await ctx.governor.connect(ctx.voter2).castVote(id, VOTE_ABSTAIN);
    await time.increase(VOTING_PERIOD + 1);
    expect(await ctx.governor.state(id)).to.equal(STATE.Succeeded);
  });

  it("Delegated voter casts vote on behalf of holder", async function () {
    const [, , , , , delegatee] = await ethers.getSigners();
    await ctx.token.transfer(delegatee.address, ethers.parseEther("60000"));
    await ctx.token.connect(delegatee).delegate(delegatee.address);
    await ctx.token.connect(ctx.voter3).delegate(delegatee.address);
    await time.increase(2);

    const targets = [await ctx.box.getAddress()];
    const values = [0];
    const calldatas = [ctx.box.interface.encodeFunctionData("store", [99])];
    const description = "Delegated voter approves";
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
    const id = await propose(ctx.governor, ctx.voter1, targets, values, calldatas, description);

    await time.increase(VOTING_DELAY + 1);
    await ctx.governor.connect(delegatee).castVote(id, VOTE_FOR);
    await ctx.governor.connect(ctx.voter1).castVote(id, VOTE_FOR);
    await time.increase(VOTING_PERIOD + 1);

    expect(await ctx.governor.state(id)).to.equal(STATE.Succeeded);
    await ctx.governor.queue(targets, values, calldatas, descriptionHash);
    await time.increase(TIMELOCK_DELAY + 1);
    await ctx.governor.execute(targets, values, calldatas, descriptionHash);
    expect(await ctx.box.retrieve()).to.equal(99n);
  });

  it("Cannot execute before timelock delay elapses", async function () {
    const targets = [await ctx.box.getAddress()];
    const values = [0];
    const calldatas = [ctx.box.interface.encodeFunctionData("store", [5])];
    const description = "early execute";
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
    const id = await propose(ctx.governor, ctx.voter1, targets, values, calldatas, description);

    await time.increase(VOTING_DELAY + 1);
    await ctx.governor.connect(ctx.voter1).castVote(id, VOTE_FOR);
    await ctx.governor.connect(ctx.voter2).castVote(id, VOTE_FOR);
    await time.increase(VOTING_PERIOD + 1);
    await ctx.governor.queue(targets, values, calldatas, descriptionHash);

    await expect(
      ctx.governor.execute(targets, values, calldatas, descriptionHash)
    ).to.be.reverted;
  });

  it("Direct call to Box.store from EOA reverts (timelock-only)", async function () {
    await expect(ctx.box.connect(ctx.voter1).store(7))
      .to.be.revertedWithCustomError(ctx.box, "OwnableUnauthorizedAccount");
  });

  it("Direct call to Treasury.sendToken from EOA reverts (timelock-only)", async function () {
    await expect(
      ctx.treasury.connect(ctx.voter1).sendToken(await ctx.token.getAddress(), ctx.voter1.address, 1n)
    ).to.be.revertedWithCustomError(ctx.treasury, "OwnableUnauthorizedAccount");
  });
});
