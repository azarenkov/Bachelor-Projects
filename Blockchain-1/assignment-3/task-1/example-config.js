// Example Configuration File
// Copy this file and update with your actual deployed contract address

const EXAMPLE_CONTRACTS = {
    // Sepolia Testnet Examples
    sepolia: {
        // Replace with your deployed SimpleToken contract address
        simpleToken: "0x0000000000000000000000000000000000000000",

        // Example of a real contract on Sepolia (USDC)
        usdcExample: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
    },

    // Goerli Testnet Examples
    goerli: {
        simpleToken: "0x0000000000000000000000000000000000000000"
    },

    // Local Development (Hardhat/Ganache)
    localhost: {
        simpleToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3" // Typical first deployment address
    }
};

// Network Information
const NETWORKS = {
    sepolia: {
        chainId: 11155111,
        name: "Sepolia",
        rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
        blockExplorer: "https://sepolia.etherscan.io"
    },
    goerli: {
        chainId: 5,
        name: "Goerli",
        rpcUrl: "https://goerli.infura.io/v3/YOUR_INFURA_KEY",
        blockExplorer: "https://goerli.etherscan.io"
    },
    localhost: {
        chainId: 31337,
        name: "Localhost",
        rpcUrl: "http://127.0.0.1:8545",
        blockExplorer: null
    }
};

// How to use this file:
// 1. Deploy your SimpleToken contract using Remix or Hardhat
// 2. Copy the deployed contract address
// 3. Update the address in the appropriate network section above
// 4. Use the address in your frontend application
//
// Example:
// const contractAddress = EXAMPLE_CONTRACTS.sepolia.simpleToken;

// Constructor Parameters Used:
// - name: "MyToken"
// - symbol: "MTK"
// - decimals: 18
// - initialSupply: 1000000000000000000000 (1000 tokens with 18 decimals)

// Quick test addresses for different scenarios:
const TEST_SCENARIOS = {
    // Zero address (for testing error handling)
    zeroAddress: "0x0000000000000000000000000000000000000000",

    // Invalid address format (for testing validation)
    invalidAddress: "0xinvalid",

    // Address with no contract (for testing contract detection)
    emptyAddress: "0x0000000000000000000000000000000000000001"
};

console.log("Example configuration loaded");
console.log("Remember to update contract addresses after deployment!");
