import React from 'react';
import { useState } from 'react';
import { Logo } from '../components/Logo';

export function AccountPage() {
  const [balance, setBalance] = useState<string>("0.00"); // This will be connected to your contract later

  return (
    <div className="flex flex-col items-center justify-start min-h-screen">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="mb-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Current Tip Balance</h2>
        <p className="text-3xl font-bold">{balance} ETH</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button 
          onClick={() => {/* Will handle modal */}}
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
    </div>
  );
}