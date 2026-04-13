const hre = require("hardhat");

async function main() {
  console.log("🔗 Crowdfunding Contract Interaction Script\n");

  // Get signers
  const [deployer, creator, contributor1, contributor2] =
    await hre.ethers.getSigners();

  console.log("Available Accounts:");
  console.log("=".repeat(60));
  console.log("Deployer:     ", deployer.address);
  console.log("Creator:      ", creator.address);
  console.log("Contributor 1:", contributor1.address);
  console.log("Contributor 2:", contributor2.address);
  console.log("=".repeat(60) + "\n");

  // Replace with your deployed contract address
  const CROWDFUNDING_ADDRESS = process.env.CONTRACT_ADDRESS || "YOUR_CONTRACT_ADDRESS_HERE";

  if (CROWDFUNDING_ADDRESS === "YOUR_CONTRACT_ADDRESS_HERE") {
    console.log("❌ Please set CONTRACT_ADDRESS environment variable");
    console.log("Example: CONTRACT_ADDRESS=0x... node scripts/interact.js\n");
    process.exit(1);
  }

  // Connect to contract
  const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
  const crowdfunding = Crowdfunding.attach(CROWDFUNDING_ADDRESS);

  console.log("Connected to Crowdfunding:", CROWDFUNDING_ADDRESS);

  // Get RewardToken address
  const rewardTokenAddress = await crowdfunding.rewardToken();
  console.log("RewardToken:", rewardTokenAddress, "\n");

  // Get contract info
  const campaignCount = await crowdfunding.campaignCount();
  console.log("Current Campaign Count:", campaignCount.toString(), "\n");

  // Example: Create a campaign
  console.log("📝 Creating a test campaign...");
  const goalInEth = "5"; // 5 ETH goal
  const durationInDays = 7; // 7 days
  const goal = hre.ethers.parseEther(goalInEth);
  const duration = durationInDays * 24 * 60 * 60;

  const createTx = await crowdfunding
    .connect(creator)
    .createCampaign(goal, duration);
  await createTx.wait();
  console.log("✅ Campaign created by:", creator.address);

  const newCampaignId = await crowdfunding.campaignCount();
  console.log("Campaign ID:", newCampaignId.toString(), "\n");

  // Get campaign details
  console.log("📊 Campaign Details:");
  console.log("=".repeat(60));
  const campaign = await crowdfunding.getCampaign(newCampaignId);
  console.log("Creator:      ", campaign.creator);
  console.log("Goal:         ", hre.ethers.formatEther(campaign.goal), "ETH");
  console.log("Amount Raised:", hre.ethers.formatEther(campaign.amountRaised), "ETH");
  console.log("Deadline:     ", new Date(Number(campaign.deadline) * 1000).toLocaleString());
  console.log("Contributors: ", campaign.contributorsCount.toString());
  console.log("Finalized:    ", campaign.finalized);
  console.log("=".repeat(60) + "\n");

  // Example: Contribute to campaign
  console.log("💰 Making test contributions...");
  const contribution1 = hre.ethers.parseEther("2");
  const contribution2 = hre.ethers.parseEther("1.5");

  const contributeTx1 = await crowdfunding
    .connect(contributor1)
    .contribute(newCampaignId, { value: contribution1 });
  await contributeTx1.wait();
  console.log("✅ Contributor 1 contributed:", hre.ethers.formatEther(contribution1), "ETH");

  const contributeTx2 = await crowdfunding
    .connect(contributor2)
    .contribute(newCampaignId, { value: contribution2 });
  await contributeTx2.wait();
  console.log("✅ Contributor 2 contributed:", hre.ethers.formatEther(contribution2), "ETH");
  console.log("");

  // Check updated campaign
  const updatedCampaign = await crowdfunding.getCampaign(newCampaignId);
  console.log("📊 Updated Campaign:");
  console.log("=".repeat(60));
  console.log("Amount Raised:", hre.ethers.formatEther(updatedCampaign.amountRaised), "ETH");
  console.log("Contributors: ", updatedCampaign.contributorsCount.toString());
  console.log("Progress:     ", (Number(updatedCampaign.amountRaised) / Number(updatedCampaign.goal) * 100).toFixed(2), "%");
  console.log("=".repeat(60) + "\n");

  // Check reward tokens
  const RewardToken = await hre.ethers.getContractFactory("RewardToken");
  const rewardToken = RewardToken.attach(rewardTokenAddress);

  const balance1 = await rewardToken.balanceOf(contributor1.address);
  const balance2 = await rewardToken.balanceOf(contributor2.address);

  console.log("🎁 Reward Token Balances:");
  console.log("=".repeat(60));
  console.log("Contributor 1:", hre.ethers.formatEther(balance1), "RWD");
  console.log("Contributor 2:", hre.ethers.formatEther(balance2), "RWD");
  console.log("=".repeat(60) + "\n");

  console.log("🎉 Interaction complete!\n");
  console.log("Next steps:");
  console.log("- Wait for campaign deadline to pass");
  console.log("- Creator can finalize the campaign");
  console.log("- If successful, creator receives funds");
  console.log("- If failed, contributors can claim refunds\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
