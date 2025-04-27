import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

// Import all tasks
import "./tasks/register";

// Dummy private key for development/CI - DO NOT use this in production!
const DUMMY_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000001";

if (!process.env.MANAGER_PRIVATE_KEY) {
  console.warn("Warning: MANAGER_PRIVATE_KEY not set in .env, using dummy key for build");
}

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    westend: {
      url: "https://westend-asset-hub-eth-rpc.polkadot.io",
      chainId: 420420421, // Updated to match the actual Westend Asset Hub chain ID
      accounts: [process.env.MANAGER_PRIVATE_KEY || DUMMY_PRIVATE_KEY],
      gas: 30000000,          // Set maximum gas limit
      gasPrice: "auto"        // Let the network determine the gas price
    }
  },
  etherscan: {
    customChains: [
      {
        network: "westend",
        chainId: 420420421, // Updated here as well for consistency
        urls: {
          apiURL: "https://blockscout-asset-hub.parity-chains-scw.parity.io/api",
          browserURL: "https://blockscout-asset-hub.parity-chains-scw.parity.io"
        }
      }
    ]
  }
};

export default config;
