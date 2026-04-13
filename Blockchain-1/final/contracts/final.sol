// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RewardToken is ERC20 {
    address public crowdfundingContract;

    constructor() ERC20("Reward Token", "RWD") {
        crowdfundingContract = msg.sender;
    }

    modifier onlyCrowdfunding() {
        require(msg.sender == crowdfundingContract, "Only crowdfunding contract");
        _;
    }

    function mint(address to, uint256 amount) external onlyCrowdfunding {
        _mint(to, amount);
    }
}

contract Crowdfunding {
    RewardToken public rewardToken;

    struct Campaign {
        address creator;
        string title;
        string description;
        uint256 goal;
        uint256 amountRaised;
        uint256 deadline;
        uint256 contributorsCount;
        bool finalized;
    }

    uint256 public campaignCount;

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public contributions;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 goal,
        uint256 deadline
    );

    event ContributionMade(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount
    );

    event CampaignFinalized(
        uint256 indexed campaignId,
        bool successful
    );

    constructor() {
        rewardToken = new RewardToken();
    }

    function createCampaign(
        string calldata _title,
        string calldata _description,
        uint256 _goal,
        uint256 _duration
    ) external {
        require(bytes(_title).length > 0, "Title required");
        require(bytes(_description).length > 0, "Description required");
        require(_goal > 0, "Goal must be > 0");
        require(_duration > 0, "Duration must be > 0");

        campaignCount++;

        campaigns[campaignCount] = Campaign({
            creator: msg.sender,
            title: _title,
            description: _description,
            goal: _goal,
            amountRaised: 0,
            deadline: block.timestamp + _duration,
            contributorsCount: 0,
            finalized: false
        });

        emit CampaignCreated(
            campaignCount,
            msg.sender,
            _title,
            _goal,
            block.timestamp + _duration
        );
    }

    function contribute(uint256 _campaignId) external payable {
        Campaign storage campaign = campaigns[_campaignId];

        require(_campaignId > 0 && _campaignId <= campaignCount, "Invalid campaign ID");
        require(!campaign.finalized, "Campaign finalized");
        require(block.timestamp < campaign.deadline, "Campaign ended");
        require(campaign.amountRaised < campaign.goal, "Goal already reached");
        require(msg.value > 0, "Zero contribution");

        if (contributions[_campaignId][msg.sender] == 0) {
            campaign.contributorsCount++;
        }

        contributions[_campaignId][msg.sender] += msg.value;
        campaign.amountRaised += msg.value;

        rewardToken.mint(msg.sender, msg.value);

        emit ContributionMade(_campaignId, msg.sender, msg.value);
    }

    function finalizeCampaign(uint256 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];

        require(_campaignId > 0 && _campaignId <= campaignCount, "Invalid campaign ID");
        require(!campaign.finalized, "Already finalized");
        require(msg.sender == campaign.creator, "Only creator");
        require(
            block.timestamp >= campaign.deadline || campaign.amountRaised >= campaign.goal,
            "Campaign not ended yet"
        );

        campaign.finalized = true;

        bool successful = campaign.amountRaised >= campaign.goal;

        if (successful) {
            (bool sent, ) = payable(campaign.creator).call{value: campaign.amountRaised}("");
            require(sent, "ETH transfer failed");
        }

        emit CampaignFinalized(_campaignId, successful);
    }

    function getCampaign(uint256 _id)
        external
        view
        returns (
            address creator,
            string memory title,
            string memory description,
            uint256 goal,
            uint256 amountRaised,
            uint256 deadline,
            uint256 contributorsCount,
            bool finalized
        )
    {
        Campaign memory c = campaigns[_id];
        return (
            c.creator,
            c.title,
            c.description,
            c.goal,
            c.amountRaised,
            c.deadline,
            c.contributorsCount,
            c.finalized
        );
    }

    function getContribution(uint256 _campaignId, address _contributor)
        external
        view
        returns (uint256)
    {
        return contributions[_campaignId][_contributor];
    }
}
