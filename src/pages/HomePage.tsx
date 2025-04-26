import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-start min-h-screen">
      <div className="mb-8">
        <Logo />
      </div>
      
      <button
        onClick={() => navigate('/account')}
        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
      >
        Connect Wallet
      </button>
    </div>
  );
}
