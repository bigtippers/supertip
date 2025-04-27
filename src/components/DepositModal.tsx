import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { TipContract } from '../lib/TipContract';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  signer: ethers.Signer;
}

export function DepositModal({ isOpen, onClose, onSuccess, signer }: DepositModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [identifiers, setIdentifiers] = useState<string[]>([]);
  const [selectedIdentifier, setSelectedIdentifier] = useState<string>('');
  const [customIdentifier, setCustomIdentifier] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    const loadIdentifiers = async () => {
      try {
        const tipContract = new TipContract(signer);
        const address = await signer.getAddress();
        const ids = await tipContract.getIdentifiers(address);
        
        // Convert bytes32 to readable strings
        const readableIds = ids.map(id => ethers.decodeBytes32String(id));
        setIdentifiers(readableIds);
        
        if (readableIds.length > 0) {
          setSelectedIdentifier(readableIds[0]);
        }
      } catch (error) {
        console.error('Failed to load identifiers:', error);
        setError('Failed to load identifiers');
      }
    };

    if (isOpen) {
      loadIdentifiers();
    }
  }, [signer, isOpen]);

  async function handleDeposit() {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!selectedIdentifier && !customIdentifier) {
      setError('Please select or enter an identifier');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const tipContract = new TipContract(signer);
      
      // Convert the identifier to bytes32
      const identifier = isCustom 
        ? ethers.encodeBytes32String(customIdentifier)
        : ethers.encodeBytes32String(selectedIdentifier);
      
      // Get deposit fee
      const depositFee = await tipContract.getDepositFee();
      
      // Convert amount to Wei and add the deposit fee
      const amountWei = ethers.parseEther(amount);
      const totalAmount = amountWei + depositFee;

      // Perform deposit
      await tipContract.deposit(identifier, totalAmount);
      
      onSuccess();
      onClose();
      setAmount('');
      setCustomIdentifier('');
      setIsCustom(false);
    } catch (error: any) {
      console.error('Deposit failed:', error);
      setError(error.message || 'Failed to deposit funds');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">Deposit WND</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Identifier
          </label>
          {identifiers.length > 0 && !isCustom && (
            <select
              value={selectedIdentifier}
              onChange={(e) => setSelectedIdentifier(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black mb-2"
            >
              {identifiers.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          )}
          
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={isCustom}
              onChange={(e) => setIsCustom(e.target.checked)}
              id="useCustom"
              className="text-black"
            />
            <label htmlFor="useCustom" className="text-sm text-gray-700">
              Use custom identifier
            </label>
          </div>

          {isCustom && (
            <input
              type="text"
              value={customIdentifier}
              onChange={(e) => setCustomIdentifier(e.target.value)}
              placeholder="Enter custom identifier"
              className="w-full p-2 border border-gray-300 rounded text-black"
            />
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (WND)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full p-2 border border-gray-300 rounded text-black"
            step="0.000000000000000001"
            min="0"
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
            onClick={handleDeposit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
          >
            {isLoading ? 'Depositing...' : 'Deposit'}
          </button>
        </div>
      </div>
    </div>
  );
}
