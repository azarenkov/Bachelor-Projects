#  Blockchain Crowdfunding DApp

A decentralized crowdfunding application built with Solidity smart contracts and vanilla JavaScript frontend. Contributors receive ERC20 reward tokens for their contributions.

##  Features

- **Create Campaigns**: Set funding goals and deadlines
- **Contribute ETH**: Support campaigns with Ethereum
- **Reward Tokens**: Receive RWD tokens (1:1 ratio with ETH)
- **Automatic Refunds**: Get refunded if campaign fails to meet goal
- **Campaign Finalization**: Creators receive funds when goal is reached
- **MetaMask Integration**: Seamless wallet connection

## ️ Project Structure

```
blockchain/
├── contracts/              # Solidity smart contracts
│   └── Crowdfunding.sol   # Main contract with RewardToken
├── scripts/               # Deployment scripts
│   └── deploy.js          # Hardhat deployment script
├── test/                  # Contract tests
│   └── Crowdfunding.test.js
├── frontend/              # Web interface
│   ├── index.html
│   ├── app.js
│   ├── contracts.js       # Contract ABIs and addresses
│   └── styles.css
├── hardhat.config.js      # Hardhat configuration
└── package.json           # Dependencies
```

## ️ Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MetaMask](https://metamask.io/) browser extension
- [Git](https://git-scm.com/)

##  Installation

1. **Clone and navigate to the project:**
   ```bash
   cd blockchain
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp env.example .env
   ```

4. **Configure `.env` file** (for testnet deployment):
   ```
   PRIVATE_KEY=your_private_key_without_0x
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   ```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Expected output: All tests should pass 

##  Deployment

### Option 1: Local Development Network (Recommended for Testing)

1. **Start local Hardhat node:**
   ```bash
   npm run node
   ```
   
   This will:
   - Start a local Ethereum node on `http://127.0.0.1:8545`
   - Provide 20 test accounts with 10,000 ETH each
   - Show account addresses and private keys

2. **Deploy contracts (in a new terminal):**
   ```bash
   npm run deploy:localhost
   ```

3. **Configure MetaMask:**
   - Network Name: `Localhost 8545`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337`
   - Currency: `ETH`
   - Import one of the test accounts using private key shown in terminal

### Option 2: Sepolia Testnet

1. **Get Sepolia ETH:**
   - Visit [Sepolia Faucet](https://sepoliafaucet.com/)
   - Enter your wallet address
   - Wait for test ETH

2. **Configure `.env`:**
   ```
   PRIVATE_KEY=your_metamask_private_key
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
   ```

3. **Deploy:**
   ```bash
   npm run deploy:sepolia
   ```

4. **Configure MetaMask:**
   - Switch to Sepolia Test Network
   - Contract address will be shown in terminal output

### Option 3: Polygon Mumbai Testnet

1. **Get Mumbai MATIC:**
   - Visit [Mumbai Faucet](https://faucet.polygon.technology/)

2. **Deploy:**
   ```bash
   npm run deploy:mumbai
   ```

##  Running the Frontend

### Method 1: Simple File Open
Simply open `frontend/index.html` in your browser.

### Method 2: Local Server (Recommended)

**Using Python:**
```bash
cd frontend
python3 -m http.server 8000
```

**Using Node.js:**
```bash
npm install -g http-server
cd frontend
http-server -p 8000
```

Then open: `http://localhost:8000`

##  Usage Guide

### For Campaign Creators:

1. **Connect MetaMask** - Click "Connect MetaMask" button
2. **Create Campaign**:
   - Enter goal amount in ETH (e.g., `10`)
   - Enter duration in days (e.g., `7`)
   - Click "Create Campaign"
   - Confirm transaction in MetaMask

3. **Finalize Campaign** (after deadline):
   - Click "Finalize" on your campaign
   - If goal reached: receive funds
   - If goal not reached: contributors can claim refunds

### For Contributors:

1. **Connect MetaMask**
2. **Browse Campaigns** - View all active campaigns
3. **Contribute**:
   - Enter amount in ETH
   - Click "Contribute"
   - Confirm transaction
   - Receive RWD tokens automatically!

4. **Claim Refund** (if campaign failed):
   - Click "Claim Refund" after campaign is finalized
   - Receive your ETH back

##  Smart Contract Details

### Crowdfunding Contract

**Main Functions:**
- `createCampaign(uint256 _goal, uint256 _duration)` - Create new campaign
- `contribute(uint256 _campaignId)` - Contribute to campaign (payable)
- `finalizeCampaign(uint256 _campaignId)` - End campaign and distribute funds
- `claimRefund(uint256 _campaignId)` - Claim refund for failed campaign
- `getCampaign(uint256 _id)` - Get campaign details
- `getContribution(uint256 _campaignId, address _contributor)` - Get contribution amount

**Events:**
- `CampaignCreated(uint256 campaignId, address creator, uint256 goal, uint256 deadline)`
- `ContributionMade(uint256 campaignId, address contributor, uint256 amount)`
- `CampaignFinalized(uint256 campaignId, bool successful)`
- `RefundClaimed(uint256 campaignId, address contributor, uint256 amount)`

### RewardToken Contract (ERC20)

- **Name**: Reward Token
- **Symbol**: RWD
- **Decimals**: 18
- **Minting**: Automatic 1:1 ratio with ETH contributions

##  Security Features

- **Reentrancy Protection**: Safe withdrawal pattern
- **Access Control**: Only creator can finalize campaigns
- **Deadline Enforcement**: Contributions blocked after deadline
- **Double-spend Prevention**: Contributions tracked per user
- **Safe Transfers**: Using low-level calls with checks

## 🧰 Useful Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Run tests with gas reporting
REPORT_GAS=true npm test

# Clean build artifacts
npx hardhat clean

# Start local node
npm run node

# Deploy to different networks
npm run deploy:localhost
npm run deploy:sepolia
npm run deploy:mumbai
```

##  Contract Addresses

After deployment, contract addresses are:
- Saved to `deployments/` directory
- Automatically updated in `frontend/contracts.js`
- Displayed in terminal output

##  Troubleshooting

### MetaMask Issues

**"Wrong Network"**
- Ensure MetaMask is on the same network where contract is deployed
- Check Chain ID matches your deployment network

**"Insufficient Funds"**
- Get test ETH from faucets (see Deployment section)
- Ensure you have enough for gas fees

### Contract Issues

**"Campaign has ended"**
- Campaign deadline has passed
- Create a new campaign or wait for creator to finalize

**"Campaign not finalized yet"**
- Only creator can finalize campaign
- Must wait until deadline has passed

### Frontend Issues

**"Contract not deployed"**
- Check contract address in `frontend/contracts.js`
- Ensure contract is deployed on connected network
- Verify deployment was successful

**"Failed to fetch"**
- Ensure local server is running
- Try using http-server instead of file:// protocol

##  Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [MetaMask Documentation](https://docs.metamask.io/)

##  License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Disclaimer

This is an educational project. Do not use in production without proper security audits.

---

**Built with ️ using Solidity, Hardhat, and Ethers.js**