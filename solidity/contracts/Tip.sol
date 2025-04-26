// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Tip {
    address payable public owner;
    address[] public managers;

    // Mapping of H(identifier) to address,
    // identify can be bluesky id, frequency id, etc.
    // If empty/unset for a given identifier, then user
    // cannot withdraw until registered.
    mapping(bytes32 => address payable) public wallets;

    // Mapping of H(identifier) to balance
    mapping(bytes32 => uint256) public balances;

    uint256 depositFee;
    uint256 withdrawFee;
    uint256 feesPaid;

    event Withdrawal(uint amount, bytes32 identifier, address wallet, uint when);
    event Deposit(uint amount, bytes32 identifier, address wallet, uint when);
    event Tipped(bytes32 sender, bytes32 recipient, uint amount);

    constructor(address manager) payable {
        owner = payable(msg.sender);
        managers.push(manager);
    }

    function register(bytes32 identifier, address payable wallet) public {
        bool canRegister = false;
        if (msg.sender == owner) {
            canRegister = true;
        }
        for (uint i = 0; (!canRegister && i < managers.length); i++) {
            if (managers[i] == msg.sender) {
                canRegister = true;
            }
        }
        require(canRegister, "You aren't a contract manager!");

        require(wallets[identifier] == address(0), "Managers cannot change registered wallets!");

        wallets[identifier] = wallet;
    }

    function transferRegistration(bytes32 identifier, address payable newWallet) public {
        require(wallets[identifier] == msg.sender, "You aren't the registered wallet!");
        wallets[identifier] = newWallet;
    }

    function tip(bytes32 sender, bytes32 recipient, uint256 amount) public {
        bool canTip = false;
        if (msg.sender == owner) {
            canTip = true;
        }
        if (wallets[sender] == msg.sender) {
            canTip = true;
        }
        for (uint i = 0; (!canTip && i < managers.length); i++) {
            if (managers[i] == msg.sender) {
                canTip = true;
            }
        }
        require(canTip, "You aren't a contract manager!");

        require(balances[sender] >= amount, "Insufficient balance");
        balances[sender] -= amount;
        balances[recipient] += amount;
        emit Tipped(sender, recipient, amount);
    }

    function deposit(bytes32 identifier) public payable {
        require(msg.value > depositFee, "Deposit must be greater than deposit fee");
        uint256 val = msg.value - depositFee;
        feesPaid += depositFee;
        emit Deposit(val, identifier, msg.sender, block.timestamp);
        balances[identifier] += val;
    }

    function withdraw(bytes32 identifier, uint256 amount) public payable {
        require(msg.value >= withdrawFee, "Insufficient withdraw fee");
        feesPaid += msg.value;
        require(wallets[identifier] == msg.sender, "You aren't the registered wallet!");

        uint256 balance = balances[identifier];
        require(balance >= amount, "Insufficient balance");

        balances[identifier] -= amount;

        emit Withdrawal(balance, identifier, wallets[identifier], block.timestamp);

        wallets[identifier].transfer(amount);
    }

    function removeManager(address manager) public {
        require(msg.sender == owner, "You aren't the contract owner!");
        for (uint i = 0; i < managers.length; i++) {
            if (managers[i] == manager) {
                managers[i] = managers[managers.length - 1];
                managers.pop();
                break;
            }
        }
    }

    function addManager(address manager) public {
        require(msg.sender == owner, "You aren't the contract owner!");
        managers.push(manager);
    }

    function transferOwnership(address newOwner) public {
        require(msg.sender == owner, "You aren't the contract owner!");
        owner = payable(newOwner);
    }

    function collectFees() public {
        require(msg.sender == owner, "You aren't the contract owner!");
        owner.transfer(feesPaid);
        feesPaid = 0;
    }


    function getDepositFee() public view returns (uint) {
        return depositFee;
    }

    function getWithdrawFee() public view returns (uint) {
        return withdrawFee;
    }

    function getBalance(bytes32 identifier) public view returns (uint) {
        return wallets[identifier].balance;
    }
}
