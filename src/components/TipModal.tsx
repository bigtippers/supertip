import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { TipContract } from '../lib/TipContract';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  signer: ethers.Signer;
}

export function TipModal({ isOpen, onClose, onSuccess, signer }: TipModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [identifiers, setIdentifiers] = useState<string[]>([]);
  const [selectedIdentifier, setSelectedIdentifier] = useState<string>('');
  const [recipientIdentifier, setRecipientIdentifier] = useState<string>('');

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

  async function handleTip() {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!selectedIdentifier) {
      setError('Please select a sending identifier');
      return;
    }

    if (!recipientIdentifier) {
      setError('Please enter a recipient identifier');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const tipContract = new TipContract(signer);
      
      // Convert the identifiers to bytes32
      const senderBytes = ethers.encodeBytes32String(selectedIdentifier);
      const recipientBytes = ethers.encodeBytes32String(recipientIdentifier);
      
      // Convert amount to Wei
      const amountWei = ethers.parseEther(amount);

      // Perform tip
      await tipContract.tip(senderBytes, recipientBytes, amountWei);
      
      onSuccess();
      onClose();
      setAmount('');
      setRecipientIdentifier('');
    } catch (error: any) {
      console.error('Tip failed:', error);
      setError(error.message || 'Failed to send tip');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">Send Tip</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Identifier
          </label>
          <select
            value={selectedIdentifier}
            onChange={(e) => setSelectedIdentifier(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
          >
            {identifiers.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To Identifier
          </label>
          <input
            type="text"
            value={recipientIdentifier}
            onChange={(e) => setRecipientIdentifier(e.target.value)}
            placeholder="Enter recipient identifier"
            className="w-full p-2 border border-gray-300 rounded text-black"
          />
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
            onClick={handleTip}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isLoading ? 'Sending...' : 'Send Tip'}
          </button>
        </div>
      </div>
    </div>
  );
}