import React, { useState, useEffect } from 'react';
import { Logo } from '../components/Logo';
import { ethers } from 'ethers';
import { TipContract } from '../lib/TipContract';
import { ethersProvider } from '../lib/ethersProvider';
import { DepositModal } from '../components/DepositModal';

export function AccountPage() {
  const [walletBalance, setWalletBalance] = useState<string>("0.00");
  const [contractBalance, setContractBalance] = useState<string>("0.00");
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    const initializeSigner = async () => {
      if (ethersProvider) {
        const newSigner = await ethersProvider.getSigner();
        setSigner(newSigner);
      }
    };
    
    initializeSigner();
  }, []);

  async function refreshBalances() {
    if (!ethersProvider) return;

    try {
      // Get wallet balance
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();
      const balance = await ethersProvider.getBalance(address);
      setWalletBalance(ethers.formatEther(balance));

      // Get contract balance
      const tipContract = new TipContract(signer);
      const identifiers = await tipContract.getIdentifiers(address);
      
      if (identifiers.length > 0) {
        const contractBalanceWei = await tipContract.getBalance(identifiers[0]);
        setContractBalance(ethers.formatEther(contractBalanceWei));
      }
    } catch (error) {
      console.error('Failed to refresh balances:', error);
    }
  }

  useEffect(() => {
    refreshBalances();
  }, []);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="mb-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Wallet Balance</h2>
        <p className="text-3xl font-bold mb-4">{walletBalance} WND</p>
        
        <h2 className="text-xl font-semibold mb-2">Tip Contract Balance</h2>
        <p className="text-3xl font-bold">{contractBalance} WND</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => {/* TODO: Implement Frequency sign in */}}
          className="bg-gray-200 text-black px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors flex items-center justify-center gap-2"
        >
          Sign in with
          <img 
            src="/frequency.svg" 
            alt="Sign in with Frequency" 
            className="w-32 h-6"
          />
        </button>

        <button
          onClick={() => {/* TODO: Implement Bluesky sign in */}}
          className="!bg-[#0085ff] text-white px-6 py-3 rounded-lg hover:!bg-blue-600 transition-colors flex items-center justify-center gap-2 flex-1"
        >
          Sign in with Bluesky
          <svg fill="none" viewBox="0 0 64 57" width="28" height="24.9375">
            <path fill="#ffffff" d="M13.873 3.805C21.21 9.332 29.103 20.537 32 26.55v15.882c0-.338-.13.044-.41.867-1.512 4.456-7.418 21.847-20.923 7.944-7.111-7.32-3.819-14.64 9.125-16.85-7.405 1.264-15.73-.825-18.014-9.015C1.12 23.022 0 8.51 0 6.55 0-3.268 8.579-.182 13.873 3.805ZM50.127 3.805C42.79 9.332 34.897 20.537 32 26.55v15.882c0-.338.13.044.41.867 1.512 4.456 7.418 21.847 20.923 7.944 7.111-7.32 3.819-14.64-9.125-16.85 7.405 1.264 15.73-.825 18.014-9.015C62.88 23.022 64 8.51 64 6.55c0-9.818-8.578-6.732-13.873-2.745Z" />
          </svg>
        </button>

        <button 
          onClick={() => setIsDepositModalOpen(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          Deposit
        </button>
        
        <button 
          onClick={() => {/* Will handle modal */}}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
        >
          Withdraw
        </button>
        
        <button 
          onClick={() => {/* Will handle modal */}}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tip
        </button>
      </div>

      {signer && (
        <DepositModal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          onSuccess={refreshBalances}
          signer={signer}
        />
      )}
    </div>
  );
}
