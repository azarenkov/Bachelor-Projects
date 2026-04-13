export const CONTRACTS = {
  CROWDFUNDING_ADDRESS: "0xf57EAe91050a62cB4C8898FC88afC8794b75d178",

  CROWDFUNDING_ABI: [
    "function campaignCount() view returns (uint256)",
    "function rewardToken() view returns (address)",

    "function createCampaign(string _title, string _description, uint256 _goal, uint256 _duration) external",
    "function contribute(uint256 _campaignId) external payable",
    "function finalizeCampaign(uint256 _campaignId) external",
    "function claimRefund(uint256 _campaignId) external",
    "function isCampaignSuccessful(uint256 _campaignId) view returns (bool)",

    "function getCampaign(uint256 _id) view returns (address, string, string, uint256, uint256, uint256, uint256, bool)",
    "function getContribution(uint256 _campaignId, address _contributor) view returns (uint256)",

    "event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goal, uint256 deadline)",
    "event ContributionMade(uint256 indexed campaignId, address indexed contributor, uint256 amount)",
    "event CampaignFinalized(uint256 indexed campaignId, bool successful)",
    "event RefundClaimed(uint256 indexed campaignId, address indexed contributor, uint256 amount)"
  ],

  TOKEN_ABI: [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function crowdfundingContract() view returns (address)"
  ]
};
