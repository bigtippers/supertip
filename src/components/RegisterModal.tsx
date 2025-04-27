import React, { useState } from 'react';
import { ethers } from 'ethers';
import { TipContract } from '../lib/TipContract';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  signer: ethers.Signer;
}

export function RegisterModal({ isOpen, onClose, onSuccess, signer }: RegisterModalProps) {
  const [identifier, setIdentifier] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  async function handleRegister() {
    if (!identifier) {
      setError('Please enter an identifier');
      return;
    }

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      setError('Please enter a valid wallet address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const tipContract = new TipContract(signer);
      const identifierBytes = ethers.encodeBytes32String(identifier);
      
      await tipContract.register(identifierBytes, walletAddress);
      
      onSuccess();
      onClose();
      setIdentifier('');
      setWalletAddress('');
    } catch (error: any) {
      console.error('Registration failed:', error);
      setError(error.message || 'Failed to register identifier');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">Register Identifier</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Identifier
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Enter identifier"
            className="w-full p-2 border border-gray-300 rounded text-black"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wallet Address
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            className="w-full p-2 border border-gray-300 rounded text-black"
          />
        </div>

        {error && (
          <div className="mb-4 text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleRegister}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
}