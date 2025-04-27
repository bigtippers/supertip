import { AtpAgent, AtpSessionData } from '@atproto/api';

const BLUESKY_SERVICE = 'https://bsky.social';

export interface BlueskySession {
  accessJwt: string;
  refreshJwt: string;
  handle: string;
  did: string;
}

class BlueskyAuth {
  private agent: AtpAgent;

  constructor() {
    this.agent = new AtpAgent({
      service: BLUESKY_SERVICE
    });
  }

  private getAuthServerUrl(): string {
    // This could be a fixed URL for Bluesky's main service
    // or dynamically determined based on the user's PDS
    return 'https://bsky.social'; // Default for Bluesky's main service
    
    // For handling users on different PDSes, you would need to:
    // 1. Resolve the user's handle to a DID
    // 2. Fetch the DID document
    // 3. Extract the authorization server URL from the DID document
  }

  /**
   * Initiates the Bluesky login flow
   */
  initiateLogin(): void {
    const redirectUrl = `${window.location.origin}/callback`;
    const authUrl = `https://bsky.app/login?redirect=${encodeURIComponent(redirectUrl)}`;
    window.location.href = authUrl;
  }

  /**
   * Handles the callback from Bluesky auth
   * @param code - The authorization code from the callback URL
   * @returns The session data if successful
   */
  async handleCallback(code: string): Promise<BlueskySession> {
    if (!code) {
      throw new Error('No authorization code provided');
    }
    
    // First, use the code to get a session through the appropriate method
    // This might be a separate API call to exchange the code for tokens
    const tokens = await this.exchangeCodeForTokens(code);
    
    // Then resume the session with the proper AtpSessionData object
    const { success, data } = await this.agent.resumeSession({
      refreshJwt: tokens.refreshJwt,
      accessJwt: tokens.accessJwt,
      handle: tokens.handle,
      did: tokens.did,
      active: false
    });
    
    if (!success || !data) {
      throw new Error('Failed to authenticate with Bluesky');
    }
    
    const session: AtpSessionData = {
      refreshJwt: tokens.refreshJwt,
      accessJwt: tokens.accessJwt,
      handle: tokens.handle,
      did: tokens.did,
      active: false
    };
    
    this.saveSession(session);
    return session;
  }
  /**
   * Saves the session to localStorage
   */
  private saveSession(session: BlueskySession): void {
    localStorage.setItem('bskySession', JSON.stringify(session));
  }

  /**
   * Gets the current session if it exists
   */
  getSession(): BlueskySession | null {
    const sessionStr = localStorage.getItem('bskySession');
    if (!sessionStr) return null;
    
    try {
      return JSON.parse(sessionStr);
    } catch {
      return null;
    }
  }
  
  async exchangeCodeForTokens(code: string): Promise<AtpSessionData> {
    if (!code) {
      throw new Error('No authorization code provided');
    }
  
    // Get the oauth server metadata from the PDS
    // This is normally cached or retrieved earlier in the flow
    const authServerUrl = this.getAuthServerUrl(); // You'll need to implement this method
    
    // Construct the token exchange request
    const tokenEndpoint = `${authServerUrl}/xrpc/com.atproto.server.exchangeAuthCode`;
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: code,
        // Include PKCE code verifier if you implemented PKCE (recommended)
        code_verifier: this.codeVerifier // This should be stored from earlier in the flow
      })
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to exchange code: ${errorData.error || response.statusText}`);
    }
  
    const data = await response.json();
    
    // Construct the AtpSessionData object
    return {
      accessJwt: data.access_token,
      refreshJwt: data.refresh_token,
      handle: data.handle,
      did: data.did,
      active: false,
      // Include any other fields that are part of AtpSessionData
    };
  }
  /**
   * Logs out the current user
   */
  logout(): void {
    localStorage.removeItem('bskySession');
    this.agent = new AtpAgent({ service: BLUESKY_SERVICE });
  }

  /**
   * Checks if the user is currently logged in
   */
  isLoggedIn(): boolean {
    return this.getSession() !== null;
  }

  /**
   * Gets the current user's handle
   */
  getCurrentUserHandle(): string | null {
    const session = this.getSession();
    return session?.handle || null;
  }

  // Add these properties to your class
private codeVerifier: string;
private codeChallenge: string;

// Generate a random code verifier
private generateCodeVerifier(): string {
  // Generate a random string of 43-128 characters
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const randomValues = new Uint8Array(64);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < 64; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
}

// Generate a code challenge (S256 method)
private async generateCodeChallenge(verifier: string): Promise<string> {
  // Create a SHA-256 hash of the verifier
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  
  // Convert the hash to base64url encoding
  return this.base64UrlEncode(hash);
}

// Utility function for base64url encoding
private base64UrlEncode(buffer: ArrayBuffer): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
// Call this before initiating the auth flow
async prepareAuthFlow(): Promise<void> {
  this.codeVerifier = this.generateCodeVerifier();
  this.codeChallenge = await this.generateCodeChallenge(this.codeVerifier);
}
}

// Export a singleton instance
export const blueskyAuth = new BlueskyAuth();