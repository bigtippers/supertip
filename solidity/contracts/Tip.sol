// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.28;

/// @title Tip Contract
/// @author Richard T. Carback III (rcarback)
/// @notice This contract provides facilities for a manager to handle tips in a 
///         social media application.
contract Tip {
    address payable public owner;
    address[] public managers;

    // Mapping of H(identifier) to address,
    // identify can be bluesky id, frequency id, etc.
    // If empty/unset for a given identifier, then user
    // cannot withdraw until registered.
    mapping(bytes32 => address payable) public wallets;

    // Mapping of user wallet address to a list of identifiers
    // Reverse mapping of the above.
    mapping(address => bytes32[]) public identifiers;

    // Mapping of H(identifier) to balance
    mapping(bytes32 => uint256) public balances;

    uint256 depositFee;
    uint256 withdrawFee;
    uint256 feesPaid;

    // We only report Withdraws, Deposits, and Tips.
    event Withdrawal(uint amount, bytes32 identifier, address wallet, uint when);
    event Deposit(uint amount, bytes32 identifier, address wallet, uint when);
    event Tipped(bytes32 sender, bytes32 recipient, uint amount);

    /// @notice Creates a new Tip contract
    /// @dev Sets the contract owner and initial manager
    /// @param manager Address of the initial manager
    constructor(address manager) payable {
        owner = payable(msg.sender);
        managers.push(manager);
        depositFee = 0;
        withdrawFee = 0;
        feesPaid = 0;
    }

    /// @notice Registers a wallet address for a given identifier
    /// @dev Only callable by contract owner or managers
    /// @param identifier The hashed identifier (e.g., hashed social media handle)
    /// @param wallet The wallet address to register
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
        identifiers[wallet].push(identifier);
    }

    /// @notice Removes a registration for an identifier
    /// @dev Only callable by the registered wallet owner
    /// @param identifier The identifier to deregister
    function deleteRegistration(bytes32 identifier) public {
        require(wallets[identifier] == msg.sender, "You aren't the registered wallet!");
        wallets[identifier] = payable(address(0));
        for (uint i = 0; i < identifiers[msg.sender].length; i++) {
            if (identifiers[msg.sender][i] == identifier) {
                identifiers[msg.sender][i] = identifiers[msg.sender][identifiers[msg.sender].length - 1];
                identifiers[msg.sender].pop();
                break;
            }
        }
    }

    /// @notice Transfers registration to a new wallet
    /// @dev Only callable by the current registered wallet
    /// @param identifier The identifier to transfer
    /// @param newWallet The new wallet address
    function transferRegistration(bytes32 identifier, address payable newWallet) public {
        require(wallets[identifier] == msg.sender, "You aren't the registered wallet!");
        wallets[identifier] = newWallet;
        identifiers[newWallet].push(identifier);
        // Delete from old wallet
        for (uint i = 0; i < identifiers[msg.sender].length; i++) {
            if (identifiers[msg.sender][i] == identifier) {
                identifiers[msg.sender][i] = identifiers[msg.sender][identifiers[msg.sender].length - 1];
                identifiers[msg.sender].pop();
                break;
            }
        }
    }

    /// @notice Transfers tips from one identifier to another
    /// @dev Only callable by owner, managers, or the sender's registered wallet
    /// @param sender The identifier sending the tip
    /// @param recipient The identifier receiving the tip
    /// @param amount The amount to tip
    /// TODO: this setup allows the managers to register any ID -> wallet mapping 
    //        (including their own), then move funds people have deposited. 
    //        We can improve this slightly by requiring a user to provide an allowance
    //        otherwise the tip fails. 
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

    /// @notice Deposits funds for an identifier
    /// @dev Requires more than deposit fee to be sent
    /// @param identifier The identifier to deposit to
    function deposit(bytes32 identifier) public payable {
        require(msg.value > depositFee, "Deposit must be greater than deposit fee");
        uint256 val = msg.value - depositFee;
        feesPaid += depositFee;
        emit Deposit(val, identifier, msg.sender, block.timestamp);
        balances[identifier] += val;
    }

    /// @notice Withdraws funds from an identifier
    /// @dev Only callable by the registered wallet, requires withdraw fee
    /// @param identifier The identifier to withdraw from
    /// @param amount The amount to withdraw
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

    /// @notice Removes a manager from the contract
    /// @dev Only callable by contract owner
    /// @param manager The manager address to remove
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

    /// @notice Adds a new manager to the contract
    /// @dev Only callable by contract owner
    /// @param manager The manager address to add
    function addManager(address manager) public {
        require(msg.sender == owner, "You aren't the contract owner!");
        managers.push(manager);
    }

    /// @notice Transfers contract ownership
    /// @dev Only callable by current owner
    /// @param newOwner Address of the new owner
    function transferOwnership(address newOwner) public {
        require(msg.sender == owner, "You aren't the contract owner!");
        owner = payable(newOwner);
    }

    /// @notice Sets the deposit fee
    /// @dev Only callable by contract owner
    /// @param fee New deposit fee amount
    function setDepositFee(uint256 fee) public {
        require(msg.sender == owner, "You aren't the contract owner!");
        depositFee = fee;
    }

    /// @notice Sets the withdrawal fee
    /// @dev Only callable by contract owner
    /// @param fee New withdrawal fee amount
    function setWithdrawFee(uint256 fee) public {
        require(msg.sender == owner, "You aren't the contract owner!");
        withdrawFee = fee;
    }

    /// @notice Collects accumulated fees
    /// @dev Only callable by contract owner
    function collectFees() public {
        require(msg.sender == owner, "You aren't the contract owner!");
        owner.transfer(feesPaid);
        feesPaid = 0;
    }

    /// @notice Gets the current deposit fee
    /// @return Current deposit fee amount
    function getDepositFee() public view returns (uint) {
        return depositFee;
    }

    /// @notice Gets the current withdrawal fee
    /// @return Current withdrawal fee amount
    function getWithdrawFee() public view returns (uint) {
        return withdrawFee;
    }

    /// @notice Gets the balance for an identifier
    /// @param identifier The identifier to check
    /// @return The current balance
    function getBalance(bytes32 identifier) public view returns (uint) {
        return wallets[identifier].balance;
    }

    /// @notice Gets the identifiers for a wallet
    /// @param wallet The wallet address to check
    /// @return The identifiers registered to the wallet
    function getIdentifiers(address wallet) public view returns (bytes32[] memory) {
        return identifiers[wallet];
    }
}
