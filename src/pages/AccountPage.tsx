import React, { useState, useEffect } from 'react';
import { Logo } from '../components/Logo';
import { ethers } from 'ethers';
import { TipContract } from '../lib/TipContract';
import { ethersProvider } from '../lib/ethersProvider';
import { DepositModal } from '../components/DepositModal';
import { RegisterModal } from '../components/RegisterModal';
import { WithdrawModal } from '../components/WithdrawModal';

interface IdentifierBalance {
  identifier: string;
  balance: string;
}

export function AccountPage() {
  const [walletBalance, setWalletBalance] = useState<string>("0.00");
  const [identifierBalances, setIdentifierBalances] = useState<IdentifierBalance[]>([]);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isManagerOrOwner, setIsManagerOrOwner] = useState(false);

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

      // Get contract balances for all identifiers
      const tipContract = new TipContract(signer);
      const identifiers = await tipContract.getIdentifiers(address);
      
      const balances = await Promise.all(
        identifiers.map(async (id) => {
          const balance = await tipContract.getBalance(id);
          return {
            identifier: ethers.decodeBytes32String(id),
            balance: ethers.formatEther(balance)
          };
        })
      );
      
      setIdentifierBalances(balances);
    } catch (error) {
      console.error('Failed to refresh balances:', error);
    }
  }

  useEffect(() => {
    refreshBalances();
    
    const intervalId = setInterval(() => {
      refreshBalances();
    }, 3000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const checkRole = async () => {
      if (!signer) return;
      
      try {
        const address = await signer.getAddress();
        const tipContract = new TipContract(signer);
        
        const [isManager, isOwner] = await Promise.all([
          tipContract.isManager(address),
          tipContract.isOwner(address)
        ]);
        
        setIsManagerOrOwner(isManager || isOwner);
      } catch (error) {
        console.error('Failed to check role:', error);
      }
    };

    checkRole();
  }, [signer]);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="mb-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Wallet Balance</h2>
        <p className="text-3xl font-bold mb-4">{walletBalance} WND</p>
        
        <h2 className="text-xl font-semibold mb-2">Tip Contract Balances</h2>
        {identifierBalances.length === 0 ? (
          <p className="text-gray-500">No identifiers registered</p>
        ) : (
          <div className="space-y-2">
            {identifierBalances.map((item) => (
              <div key={item.identifier} className="p-4 bg-blue-900 rounded-lg flex justify-between items-center">
                <p className="text-white text-lg truncate max-w-[200px]" title={item.identifier}>
                  {item.identifier}
                </p>
                <p className="text-white text-lg font-bold">
                  {Number(item.balance).toFixed(4)} WND
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
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
          onClick={() => setIsDepositModalOpen(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          Deposit
        </button>
        
        <button 
          onClick={() => setIsWithdrawModalOpen(true)}
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

      {isManagerOrOwner && (
        <div className="mt-8 w-full max-w-xs">
          <h2 className="text-xl font-semibold mb-4 text-center">Manager Controls</h2>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Register Identifier
          </button>
        </div>
      )}

      {signer && (
        <>
          <DepositModal
            isOpen={isDepositModalOpen}
            onClose={() => setIsDepositModalOpen(false)}
            onSuccess={refreshBalances}
            signer={signer}
          />
          <WithdrawModal
            isOpen={isWithdrawModalOpen}
            onClose={() => setIsWithdrawModalOpen(false)}
            onSuccess={refreshBalances}
            signer={signer}
          />
          <RegisterModal
            isOpen={isRegisterModalOpen}
            onClose={() => setIsRegisterModalOpen(false)}
            onSuccess={refreshBalances}
            signer={signer}
          />
        </>
      )}
    </div>
  );
}
