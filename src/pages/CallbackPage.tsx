import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { blueskyAuth } from '../lib/bluesky';

export function CallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        
        if (!code) {
          throw new Error('No authorization code received');
        }

        await blueskyAuth.handleCallback(code);
        navigate('/account');
      } catch (error) {
        console.error('Auth callback failed:', error);
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Authenticating with Bluesky...</p>
    </div>
  );
}