import { task } from "hardhat/config";
import { ethers } from "ethers";
import { Tip } from "../typechain-types";

task("register-identifier", "Registers an identifier with a wallet address")
  .addParam("identifier", "The identifier to register (will be converted to bytes32)")
  .addParam("wallet", "The wallet address to register")
  .addOptionalParam("contract", "The deployed contract address", process.env.CONTRACT_ADDRESS)
  .setAction(async (taskArgs, hre) => {
    const { identifier, wallet, contract } = taskArgs;

    if (!contract) {
      throw new Error("CONTRACT_ADDRESS not set in .env and no contract address provided");
    }

    // Get the contract with proper typing
    const Tip = await hre.ethers.getContractFactory("Tip");
    const tip = (await Tip.attach(contract)) as Tip;

    // Convert identifier to bytes32
    const identifierBytes = ethers.encodeBytes32String(identifier);

    // Register the identifier with explicit gas settings
    const tx = await tip.register(identifierBytes, wallet, {
      gasLimit: 30000000,
      type: 2  // Explicitly set EIP-1559 transaction type
    });
    await tx.wait();

    console.log(`Registered identifier '${identifier}' for wallet ${wallet}`);
    console.log(`Transaction hash: ${tx.hash}`);
  });
