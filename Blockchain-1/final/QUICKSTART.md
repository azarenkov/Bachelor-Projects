# ⚡ Quick Start Guide

Get your Crowdfunding DApp running in 5 minutes!

##  Option 1: Local Development (Fastest)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Local Blockchain
Open a terminal and run:
```bash
npm run node
```

Keep this terminal open! You'll see 20 test accounts with private keys.

### Step 3: Deploy Contract
Open a NEW terminal and run:
```bash
npm run deploy:localhost
```

Copy the contract address from the output. It will look like:
```
 Crowdfunding deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Step 4: Setup MetaMask

1. **Add Network:**
   - Network Name: `Localhost 8545`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337`
   - Currency: `ETH`

2. **Import Account:**
   - Copy any private key from Step 2 terminal
   - MetaMask → Import Account → Paste private key
   - You'll have 10,000 test ETH!

### Step 5: Run Frontend
```bash
cd frontend
python3 -m http.server 8000
```

Or if you prefer Node.js:
```bash
npx http-server frontend -p 8000
```

### Step 6: Open DApp
Open browser: `http://localhost:8000`

Click "Connect MetaMask" and start using the DApp! 

---

## 🧪 Option 2: Test First

Want to verify everything works? Run tests:

```bash
npm test
```

You should see all tests pass 

---

##  Quick Usage

### Create a Campaign
1. Connect MetaMask
2. Enter goal (e.g., `5` ETH)
3. Enter duration (e.g., `7` days)
4. Click "Create Campaign"
5. Confirm in MetaMask

### Contribute to Campaign
1. Find a campaign
2. Enter amount (e.g., `1` ETH)
3. Click "Contribute"
4. Confirm in MetaMask
5. Get RWD tokens automatically!

### Test Full Flow
1. Import 2+ MetaMask accounts
2. Create campaign with Account 1
3. Contribute with Account 2
4. Wait for deadline (or fast-forward in Hardhat)
5. Finalize campaign with Account 1
6. If failed, claim refund with Account 2

---

##  Troubleshooting

**"Nonce too high"**
→ Reset MetaMask: Settings → Advanced → Clear activity tab data

**"Wrong network"**
→ Switch MetaMask to Localhost 8545 (Chain ID 1337)

**"Cannot find module"**
→ Run `npm install` again

**"Port already in use"**
→ Use different port: `python3 -m http.server 8001`

---

##  What You Get

 Full crowdfunding platform
 ERC20 reward tokens (RWD)
 Automatic refunds for failed campaigns
 MetaMask integration
 Real-time updates

---

##  Next Steps

- Read full documentation: `README.md`
- Explore contracts: `contracts/Crowdfunding.sol`
- Check tests: `test/Crowdfunding.test.js`
- Deploy to testnet: `npm run deploy:sepolia`

---

**Need help?** Check the full README.md or contract comments!