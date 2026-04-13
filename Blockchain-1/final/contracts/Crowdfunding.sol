// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RewardToken
 * @dev ERC20 token that is minted as reward for campaign contributions
 */
contract RewardToken is ERC20 {
    address public crowdfundingContract;

    constructor() ERC20("Reward Token", "RWD") {
        crowdfundingContract = msg.sender;
    }

    modifier onlyCrowdfunding() {
        require(
            msg.sender == crowdfundingContract,
            "Only crowdfunding contract can mint"
        );
        _;
    }

    /**
     * @dev Mint new reward tokens to contributors
     * @param to Address to receive tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyCrowdfunding {
        _mint(to, amount);
    }
}

/**
 * @title Crowdfunding
 * @dev Main crowdfunding contract that manages campaigns and contributions
 */
contract Crowdfunding {
    RewardToken public rewardToken;

    struct Campaign {
        address creator;
        uint256 goal;
        uint256 amountRaised;
        uint256 deadline;
        uint256 contributorsCount;
        bool finalized;
    }

    // Campaign ID => Campaign data
    mapping(uint256 => Campaign) public campaigns;

    // Campaign ID => Contributor address => Contribution amount
    mapping(uint256 => mapping(address => uint256)) public contributions;

    uint256 public campaignCount;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 goal,
        uint256 deadline
    );

    event ContributionMade(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount
    );

    event CampaignFinalized(uint256 indexed campaignId, bool successful);

    event RefundClaimed(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount
    );

    constructor() {
        rewardToken = new RewardToken();
    }

    /**
     * @dev Create a new crowdfunding campaign
     * @param _goal Campaign goal in wei
     * @param _duration Campaign duration in seconds
     */
    function createCampaign(uint256 _goal, uint256 _duration) external {
        require(_goal > 0, "Goal must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");

        campaignCount++;

        campaigns[campaignCount] = Campaign({
            creator: msg.sender,
            goal: _goal,
            amountRaised: 0,
            deadline: block.timestamp + _duration,
            contributorsCount: 0,
            finalized: false
        });

        emit CampaignCreated(
            campaignCount,
            msg.sender,
            _goal,
            block.timestamp + _duration
        );
    }

    /**
     * @dev Contribute ETH to a campaign
     * @param _campaignId ID of the campaign to contribute to
     */
    function contribute(uint256 _campaignId) external payable {
        Campaign storage campaign = campaigns[_campaignId];

        require(
            _campaignId > 0 && _campaignId <= campaignCount,
            "Invalid campaign ID"
        );
        require(block.timestamp < campaign.deadline, "Campaign has ended");
        require(!campaign.finalized, "Campaign already finalized");
        require(msg.value > 0, "Contribution must be greater than 0");

        // Track if this is a new contributor
        if (contributions[_campaignId][msg.sender] == 0) {
            campaign.contributorsCount++;
        }

        contributions[_campaignId][msg.sender] += msg.value;
        campaign.amountRaised += msg.value;

        // Mint reward tokens (1:1 ratio with ETH)
        rewardToken.mint(msg.sender, msg.value);

        emit ContributionMade(_campaignId, msg.sender, msg.value);
    }

    /**
     * @dev Finalize a campaign after deadline
     * @param _campaignId ID of the campaign to finalize
     */
    function finalizeCampaign(uint256 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];

        require(
            _campaignId > 0 && _campaignId <= campaignCount,
            "Invalid campaign ID"
        );
        require(
            block.timestamp >= campaign.deadline,
            "Campaign has not ended yet"
        );
        require(!campaign.finalized, "Campaign already finalized");
        require(msg.sender == campaign.creator, "Only creator can finalize");

        campaign.finalized = true;

        bool successful = campaign.amountRaised >= campaign.goal;

        if (successful) {
            // Transfer funds to creator if goal reached
            (bool sent, ) = payable(campaign.creator).call{
                value: campaign.amountRaised
            }("");
            require(sent, "Failed to send ETH to creator");
        }
        // If not successful, contributors can claim refunds individually

        emit CampaignFinalized(_campaignId, successful);
    }

    /**
     * @dev Claim refund for a failed campaign
     * @param _campaignId ID of the campaign to claim refund from
     */
    function claimRefund(uint256 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];

        require(
            _campaignId > 0 && _campaignId <= campaignCount,
            "Invalid campaign ID"
        );
        require(campaign.finalized, "Campaign not finalized yet");
        require(
            campaign.amountRaised < campaign.goal,
            "Campaign was successful, no refunds"
        );

        uint256 contributedAmount = contributions[_campaignId][msg.sender];
        require(contributedAmount > 0, "No contribution found");

        // Reset contribution before transfer to prevent reentrancy
        contributions[_campaignId][msg.sender] = 0;

        (bool sent, ) = payable(msg.sender).call{value: contributedAmount}("");
        require(sent, "Failed to send refund");

        emit RefundClaimed(_campaignId, msg.sender, contributedAmount);
    }

    /**
     * @dev Get campaign details
     * @param _id Campaign ID
     */
    function getCampaign(
        uint256 _id
    )
        external
        view
        returns (
            address creator,
            uint256 goal,
            uint256 amountRaised,
            uint256 deadline,
            uint256 contributorsCount,
            bool finalized
        )
    {
        Campaign memory campaign = campaigns[_id];
        return (
            campaign.creator,
            campaign.goal,
            campaign.amountRaised,
            campaign.deadline,
            campaign.contributorsCount,
            campaign.finalized
        );
    }

    /**
     * @dev Get contribution amount for a specific contributor
     * @param _campaignId Campaign ID
     * @param _contributor Contributor address
     */
    function getContribution(
        uint256 _campaignId,
        address _contributor
    ) external view returns (uint256) {
        return contributions[_campaignId][_contributor];
    }

    /**
     * @dev Check if a campaign was successful
     * @param _campaignId Campaign ID
     */
    function isCampaignSuccessful(
        uint256 _campaignId
    ) external view returns (bool) {
        Campaign memory campaign = campaigns[_campaignId];
        require(campaign.finalized, "Campaign not finalized yet");
        return campaign.amountRaised >= campaign.goal;
    }
}
