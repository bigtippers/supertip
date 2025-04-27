import React, { useState } from 'react';
import { ethers } from 'ethers';
import { TipContract } from '../lib/TipContract';

interface AddManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  signer: ethers.Signer;
}

export function AddManagerModal({ isOpen, onClose, onSuccess, signer }: AddManagerModalProps) {
  const [managerAddress, setManagerAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  async function handleAddManager() {
    if (!managerAddress || !ethers.isAddress(managerAddress)) {
      setError('Please enter a valid wallet address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const tipContract = new TipContract(signer);
      await tipContract.addManager(managerAddress);
      
      onSuccess();
      onClose();
      setManagerAddress('');
    } catch (error: any) {
      console.error('Failed to add manager:', error);
      setError(error.message || 'Failed to add manager');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">Add Manager</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Manager Wallet Address
          </label>
          <input
            type="text"
            value={managerAddress}
            onChange={(e) => setManagerAddress(e.target.value)}
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
            onClick={handleAddManager}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-300"
          >
            {isLoading ? 'Adding...' : 'Add Manager'}
          </button>
        </div>
      </div>
    </div>
  );
}