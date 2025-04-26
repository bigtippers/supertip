import { Contract, Signer, Provider, AddressLike, BytesLike, BigNumberish } from 'ethers';
import { Tip } from '../../solidity/typechain-types/Tip';
import { Tip__factory } from '../../solidity/typechain-types/factories/Tip__factory';

const DEFAULT_ADDRESS = '0x888175972f6570894e7ca8f1cae817047c9ba835';

export class TipContract {
    private contract: Tip;

    constructor(
        signerOrProvider: Signer | Provider,
        address: string = DEFAULT_ADDRESS
    ) {
        this.contract = Tip__factory.connect(address, signerOrProvider);
    }

    // Registration functions
    async register(identifier: BytesLike, wallet: AddressLike): Promise<void> {
        const tx = await this.contract.register(identifier, wallet);
        await tx.wait();
    }

    async transferRegistration(identifier: BytesLike, newWallet: AddressLike): Promise<void> {
        const tx = await this.contract.transferRegistration(identifier, newWallet);
        await tx.wait();
    }

    // Balance and wallet management
    async deposit(identifier: BytesLike, amount: BigNumberish): Promise<void> {
        const tx = await this.contract.deposit(identifier, { value: amount });
        await tx.wait();
    }

    async withdraw(identifier: BytesLike, amount: BigNumberish): Promise<void> {
        const withdrawFee = await this.contract.getWithdrawFee();
        const tx = await this.contract.withdraw(identifier, amount, { value: withdrawFee });
        await tx.wait();
    }

    async tip(sender: BytesLike, recipient: BytesLike, amount: BigNumberish): Promise<void> {
        const tx = await this.contract.tip(sender, recipient, amount);
        await tx.wait();
    }

    // View functions
    async getBalance(identifier: BytesLike): Promise<bigint> {
        return await this.contract.balances(identifier);
    }

    async getWallet(identifier: BytesLike): Promise<string> {
        return await this.contract.wallets(identifier);
    }

    async getIdentifiers(wallet: AddressLike): Promise<BytesLike[]> {
        return await this.contract.getIdentifiers(wallet);
    }

    async getDepositFee(): Promise<bigint> {
        return await this.contract.getDepositFee();
    }

    async getWithdrawFee(): Promise<bigint> {
        return await this.contract.getWithdrawFee();
    }

    // Admin functions
    async addManager(manager: AddressLike): Promise<void> {
        const tx = await this.contract.addManager(manager);
        await tx.wait();
    }

    async removeManager(manager: AddressLike): Promise<void> {
        const tx = await this.contract.removeManager(manager);
        await tx.wait();
    }

    async transferOwnership(newOwner: AddressLike): Promise<void> {
        const tx = await this.contract.transferOwnership(newOwner);
        await tx.wait();
    }

    async setDepositFee(fee: BigNumberish): Promise<void> {
        const tx = await this.contract.setDepositFee(fee);
        await tx.wait();
    }

    async setWithdrawFee(fee: BigNumberish): Promise<void> {
        const tx = await this.contract.setWithdrawFee(fee);
        await tx.wait();
    }

    async collectFees(): Promise<void> {
        const tx = await this.contract.collectFees();
        await tx.wait();
    }

    // Getters
    async getOwner(): Promise<string> {
        return await this.contract.owner();
    }

    async isManager(address: string): Promise<boolean> {
        const managersList: string[] = [];
        let i = 0;
        try {
            while (true) {
                const manager = await this.contract.managers(i);
                managersList.push(manager);
                i++;
            }
        } catch (e) {
            // Array end reached
        }
        return managersList.includes(address);
    }

    async isOwner(address: string): Promise<boolean> {
        const owner = await this.contract.owner();
        return owner.toLowerCase() === address.toLowerCase();
    }
}
