import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { ethersProvider } from '../lib/ethersProvider';
import { ethers } from 'ethers';

export function HomePage() {
  const navigate = useNavigate();

  async function handleConnectWallet() {
    if (!ethersProvider) {
      alert('Metamask wallet not detected. Please install Metamask to continue.');
      return;
    }

    try {
      // Let's check the actual chain ID from the network first
      const provider = new ethers.JsonRpcProvider("https://westend-asset-hub-eth-rpc.polkadot.io");
      const network = await provider.getNetwork();
      console.log("Actual network chainId:", network.chainId.toString());
      const chainIdHex = `0x${network.chainId.toString(16)}`;
      
      // First try to switch to Asset-Hub Westend Testnet
      try {
        await ethersProvider.send("wallet_switchEthereumChain", [{ chainId: chainIdHex }]);
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.error.code === 4902) {
          await ethersProvider.send("wallet_addEthereumChain", [{
            chainId: chainIdHex,
            chainName: "Asset-Hub Westend Testnet",
            nativeCurrency: {
              name: "Westend",
              symbol: "WND",
              decimals: 18
            },
            rpcUrls: ["https://westend-asset-hub-eth-rpc.polkadot.io"],
            blockExplorerUrls: ["https://blockscout-asset-hub.parity-chains-scw.parity.io"]
          }]);
        } else {
          throw switchError;
        }
      }

      // Now connect the wallet
      await ethersProvider.send("eth_requestAccounts", []);
      
      // Check if we have connected accounts
      const accounts = await ethersProvider.listAccounts();
      if (accounts.length === 0) {
        alert('Please connect at least one account to continue.');
        return;
      }
      
      console.log('Connected account:', accounts[0].address);
      navigate('/account');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen">
      <div className="mb-20">
        <Logo />
      </div>
      
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={handleConnectWallet}
          className="!bg-[#0085ff] text-white px-6 py-3 rounded-lg hover:!bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          Connect Wallet with Metamask
        </button>
      </div>
    </div>
  );
}
