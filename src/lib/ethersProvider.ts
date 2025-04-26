import { BrowserProvider } from "ethers";

// Browser wallet will inject the ethereum object into the window object
if (typeof window.ethereum == "undefined") {
  console.warn("Metamask wallet not detected");
}

export const ethersProvider = window.ethereum ? new BrowserProvider(window.ethereum) : null;
