declare global {
  interface Window {
    ethereum?: import('ethers').Eip1193Provider;
  }
}
export default global;
