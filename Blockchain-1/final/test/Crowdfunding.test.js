const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Crowdfunding Contract", function () {
  let crowdfunding;
  let rewardToken;
  let owner;
  let creator;
  let contributor1;
  let contributor2;

  const GOAL = ethers.parseEther("10"); // 10 ETH
  const DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

  beforeEach(async function () {
    // Get signers
    [owner, creator, contributor1, contributor2] = await ethers.getSigners();

    // Deploy Crowdfunding contract
    const Crowdfunding = await ethers.getContractFactory("Crowdfunding");
    crowdfunding = await Crowdfunding.deploy();
    await crowdfunding.waitForDeployment();

    // Get RewardToken address
    const rewardTokenAddress = await crowdfunding.rewardToken();
    const RewardToken = await ethers.getContractFactory("RewardToken");
    rewardToken = RewardToken.attach(rewardTokenAddress);
  });

  describe("Deployment", function () {
    it("Should deploy RewardToken automatically", async function () {
      const tokenAddress = await crowdfunding.rewardToken();
      expect(tokenAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should set correct token name and symbol", async function () {
      expect(await rewardToken.name()).to.equal("Reward Token");
      expect(await rewardToken.symbol()).to.equal("RWD");
    });

    it("Should set crowdfunding contract as token minter", async function () {
      const crowdfundingAddress = await crowdfunding.getAddress();
      expect(await rewardToken.crowdfundingContract()).to.equal(
        crowdfundingAddress
      );
    });
  });

  describe("Campaign Creation", function () {
    it("Should create a campaign successfully", async function () {
      const tx = await crowdfunding
        .connect(creator)
        .createCampaign(GOAL, DURATION);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(crowdfunding, "CampaignCreated")
        .withArgs(1, creator.address, GOAL, block.timestamp + DURATION);

      const campaign = await crowdfunding.getCampaign(1);
      expect(campaign.creator).to.equal(creator.address);
      expect(campaign.goal).to.equal(GOAL);
      expect(campaign.amountRaised).to.equal(0);
      expect(campaign.contributorsCount).to.equal(0);
      expect(campaign.finalized).to.equal(false);
    });

    it("Should increment campaign count", async function () {
      expect(await crowdfunding.campaignCount()).to.equal(0);

      await crowdfunding.connect(creator).createCampaign(GOAL, DURATION);
      expect(await crowdfunding.campaignCount()).to.equal(1);

      await crowdfunding.connect(creator).createCampaign(GOAL, DURATION);
      expect(await crowdfunding.campaignCount()).to.equal(2);
    });

    it("Should revert if goal is 0", async function () {
      await expect(
        crowdfunding.connect(creator).createCampaign(0, DURATION)
      ).to.be.revertedWith("Goal must be greater than 0");
    });

    it("Should revert if duration is 0", async function () {
      await expect(
        crowdfunding.connect(creator).createCampaign(GOAL, 0)
      ).to.be.revertedWith("Duration must be greater than 0");
    });
  });

  describe("Contributions", function () {
    beforeEach(async function () {
      // Create a campaign
      await crowdfunding.connect(creator).createCampaign(GOAL, DURATION);
    });

    it("Should allow contributions to active campaign", async function () {
      const contribution = ethers.parseEther("1");

      await expect(
        crowdfunding
          .connect(contributor1)
          .contribute(1, { value: contribution })
      )
        .to.emit(crowdfunding, "ContributionMade")
        .withArgs(1, contributor1.address, contribution);

      const campaign = await crowdfunding.getCampaign(1);
      expect(campaign.amountRaised).to.equal(contribution);
      expect(campaign.contributorsCount).to.equal(1);
    });

    it("Should mint reward tokens to contributors", async function () {
      const contribution = ethers.parseEther("2");

      await crowdfunding
        .connect(contributor1)
        .contribute(1, { value: contribution });

      const tokenBalance = await rewardToken.balanceOf(contributor1.address);
      expect(tokenBalance).to.equal(contribution);
    });

    it("Should track multiple contributions from same user", async function () {
      const contribution1 = ethers.parseEther("1");
      const contribution2 = ethers.parseEther("2");

      await crowdfunding
        .connect(contributor1)
        .contribute(1, { value: contribution1 });
      await crowdfunding
        .connect(contributor1)
        .contribute(1, { value: contribution2 });

      const totalContribution = await crowdfunding.getContribution(
        1,
        contributor1.address
      );
      expect(totalContribution).to.equal(contribution1 + contribution2);

      const campaign = await crowdfunding.getCampaign(1);
      expect(campaign.contributorsCount).to.equal(1); // Still only 1 unique contributor
    });

    it("Should track multiple contributors", async function () {
      await crowdfunding
        .connect(contributor1)
        .contribute(1, { value: ethers.parseEther("1") });
      await crowdfunding
        .connect(contributor2)
        .contribute(1, { value: ethers.parseEther("2") });

      const campaign = await crowdfunding.getCampaign(1);
      expect(campaign.contributorsCount).to.equal(2);
    });

    it("Should revert contribution to invalid campaign", async function () {
      await expect(
        crowdfunding
          .connect(contributor1)
          .contribute(999, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Invalid campaign ID");
    });

    it("Should revert contribution with 0 value", async function () {
      await expect(
        crowdfunding.connect(contributor1).contribute(1, { value: 0 })
      ).to.be.revertedWith("Contribution must be greater than 0");
    });

    it("Should revert contribution after deadline", async function () {
      // Fast forward time past deadline
      await time.increase(DURATION + 1);

      await expect(
        crowdfunding
          .connect(contributor1)
          .contribute(1, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Campaign has ended");
    });

    it("Should revert contribution to finalized campaign", async function () {
      // Contribute enough to reach goal
      await crowdfunding.connect(contributor1).contribute(1, { value: GOAL });

      // Fast forward past deadline and finalize
      await time.increase(DURATION + 1);
      await crowdfunding.connect(creator).finalizeCampaign(1);

      // Try to contribute again - will fail with "Campaign has ended" since we check deadline first
      await expect(
        crowdfunding
          .connect(contributor2)
          .contribute(1, { value: ethers.parseEther("1") })
      ).to.be.reverted;
    });
  });

  describe("Campaign Finalization", function () {
    beforeEach(async function () {
      await crowdfunding.connect(creator).createCampaign(GOAL, DURATION);
    });

    it("Should finalize successful campaign and transfer funds", async function () {
      // Contribute to reach goal
      await crowdfunding.connect(contributor1).contribute(1, { value: GOAL });

      const creatorBalanceBefore = await ethers.provider.getBalance(
        creator.address
      );

      // Fast forward past deadline
      await time.increase(DURATION + 1);

      const tx = await crowdfunding.connect(creator).finalizeCampaign(1);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const creatorBalanceAfter = await ethers.provider.getBalance(
        creator.address
      );

      expect(creatorBalanceAfter).to.equal(
        creatorBalanceBefore + GOAL - gasUsed
      );

      const campaign = await crowdfunding.getCampaign(1);
      expect(campaign.finalized).to.equal(true);
    });

    it("Should emit CampaignFinalized event", async function () {
      await crowdfunding.connect(contributor1).contribute(1, { value: GOAL });

      await time.increase(DURATION + 1);

      await expect(crowdfunding.connect(creator).finalizeCampaign(1))
        .to.emit(crowdfunding, "CampaignFinalized")
        .withArgs(1, true);
    });

    it("Should finalize unsuccessful campaign without transfer", async function () {
      // Contribute less than goal
      await crowdfunding
        .connect(contributor1)
        .contribute(1, { value: ethers.parseEther("5") });

      await time.increase(DURATION + 1);

      await expect(crowdfunding.connect(creator).finalizeCampaign(1))
        .to.emit(crowdfunding, "CampaignFinalized")
        .withArgs(1, false);

      const campaign = await crowdfunding.getCampaign(1);
      expect(campaign.finalized).to.equal(true);
    });

    it("Should revert if not creator tries to finalize", async function () {
      await time.increase(DURATION + 1);

      await expect(
        crowdfunding.connect(contributor1).finalizeCampaign(1)
      ).to.be.revertedWith("Only creator can finalize");
    });

    it("Should revert finalization before deadline", async function () {
      await expect(
        crowdfunding.connect(creator).finalizeCampaign(1)
      ).to.be.revertedWith("Campaign has not ended yet");
    });

    it("Should revert double finalization", async function () {
      await time.increase(DURATION + 1);

      await crowdfunding.connect(creator).finalizeCampaign(1);

      await expect(
        crowdfunding.connect(creator).finalizeCampaign(1)
      ).to.be.revertedWith("Campaign already finalized");
    });
  });

  describe("Refunds", function () {
    beforeEach(async function () {
      await crowdfunding.connect(creator).createCampaign(GOAL, DURATION);
    });

    it("Should allow refund claim for failed campaign", async function () {
      const contribution = ethers.parseEther("5");

      await crowdfunding
        .connect(contributor1)
        .contribute(1, { value: contribution });

      // Fast forward and finalize as failed
      await time.increase(DURATION + 1);
      await crowdfunding.connect(creator).finalizeCampaign(1);

      const balanceBefore = await ethers.provider.getBalance(
        contributor1.address
      );

      const tx = await crowdfunding.connect(contributor1).claimRefund(1);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(
        contributor1.address
      );

      expect(balanceAfter).to.equal(balanceBefore + contribution - gasUsed);
    });

    it("Should emit RefundClaimed event", async function () {
      const contribution = ethers.parseEther("5");

      await crowdfunding
        .connect(contributor1)
        .contribute(1, { value: contribution });

      await time.increase(DURATION + 1);
      await crowdfunding.connect(creator).finalizeCampaign(1);

      await expect(crowdfunding.connect(contributor1).claimRefund(1))
        .to.emit(crowdfunding, "RefundClaimed")
        .withArgs(1, contributor1.address, contribution);
    });

    it("Should prevent double refund claim", async function () {
      const contribution = ethers.parseEther("5");

      await crowdfunding
        .connect(contributor1)
        .contribute(1, { value: contribution });

      await time.increase(DURATION + 1);
      await crowdfunding.connect(creator).finalizeCampaign(1);

      await crowdfunding.connect(contributor1).claimRefund(1);

      await expect(
        crowdfunding.connect(contributor1).claimRefund(1)
      ).to.be.revertedWith("No contribution found");
    });

    it("Should revert refund for successful campaign", async function () {
      await crowdfunding.connect(contributor1).contribute(1, { value: GOAL });

      await time.increase(DURATION + 1);
      await crowdfunding.connect(creator).finalizeCampaign(1);

      await expect(
        crowdfunding.connect(contributor1).claimRefund(1)
      ).to.be.revertedWith("Campaign was successful, no refunds");
    });

    it("Should revert refund before finalization", async function () {
      await crowdfunding
        .connect(contributor1)
        .contribute(1, { value: ethers.parseEther("5") });

      await expect(
        crowdfunding.connect(contributor1).claimRefund(1)
      ).to.be.revertedWith("Campaign not finalized yet");
    });

    it("Should revert refund if no contribution", async function () {
      await crowdfunding
        .connect(contributor1)
        .contribute(1, { value: ethers.parseEther("5") });

      await time.increase(DURATION + 1);
      await crowdfunding.connect(creator).finalizeCampaign(1);

      await expect(
        crowdfunding.connect(contributor2).claimRefund(1)
      ).to.be.revertedWith("No contribution found");
    });
  });

  describe("Helper Functions", function () {
    it("Should check campaign success status", async function () {
      await crowdfunding.connect(creator).createCampaign(GOAL, DURATION);

      await crowdfunding.connect(contributor1).contribute(1, { value: GOAL });

      await time.increase(DURATION + 1);
      await crowdfunding.connect(creator).finalizeCampaign(1);

      expect(await crowdfunding.isCampaignSuccessful(1)).to.equal(true);
    });

    it("Should revert success check for non-finalized campaign", async function () {
      await crowdfunding.connect(creator).createCampaign(GOAL, DURATION);

      await expect(crowdfunding.isCampaignSuccessful(1)).to.be.revertedWith(
        "Campaign not finalized yet"
      );
    });
  });
});
