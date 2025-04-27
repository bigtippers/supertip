# supertip

This is the source repository for the April 2025 Harvard EasyA Hackathon submission of the Supertip project by the Bigtippers.

Supertip brings tipping token functionality to **<u>any social media supporting decentralized identities</u>** (DIDs). 
Tipping tokens allow users to send small "tips" in the token currency to their favorite creators, 
allowing for micropayments and providing monetization options for creators beyond those provided by the traditional advertising model. 
Tipping creates a more rich and interactive experience for audiences by creating direct financial connections and incentives with creators.

Unlike platform-specific solutions, Supertip works across the growing ecosystem of decentralized social networks, 
including [Bluesky](https://bsky.app) and [Frequency](https://frequency.xyz). Inspired by the innovative
[open tipping tokens protocol](https://github.com/degen-token/DIPs/blob/main/dip-0002.md), our implementation extends these 
capabilities to create a unified tipping experience regardless of where content appears.

Supertip keeps users *inside of their own ecosystem*, using replies and direct messages inside of the apps they already
know and love to send tips and run tipping campaigns. Our approach avoids the "activation energy" problem entirely for users to 
participate. They only need to use specialized interfaces to fund and withdraw from their tipping accounts.

DIDs are the linchpin that makes our approach viable. They enable a trust model where verification does not depend on 
centralized authorities - instead, a cryptographic proof can be independently verified by anyone. This independent verification
is extended directly to a smart contract in our model. Allowing users to control ownership and secure their tipping pools even without
a pre-established cryptographic wallet.

In our implementation, we used Polkadot's smart contract functionality to integrate with Bluesky, with plans for Frequency that fell short.
The demo shows the entire UX from tipping someone to registering a wallet and withdrawing funds, with additional UX (tipping pools, automated rewards distributions, etc)
being relatively straightforward to implement in the current model without changing the underlying smart contract as currently implemented.

Our smart contract is designed to be extended to work with different types of DIDs by adding a registration function for each 
different type of DID. The contract lazily maps those DIDs to crypto wallets when users if users choose to deposit or withdraw funds. Because both
Bluesky and Frequency have similar DID functionalities, the path to complete full signature verification is similarly direct.

We believe that Supertip can help creators build sustainable income streams directly from their most engaged fans that eliminate all middlement,
while audiences gain new ways to recognize and reward exceptional content. Supertip builds a more connected, creator-friendly web where value
flows to those who truly deserve it.

## Demo Video

## Screenshots

## Technical Details

<img width="757" alt="Screenshot 2025-04-27 at 7 40 02 AM" src="https://github.com/user-attachments/assets/9035fe49-de3c-4a48-bab9-cb5f180936c9" />

Users interact through the web UI
Social media interactions are processed by the bot
All financial transactions are handled by the smart contract

### app.bigtippers.net UI

A React application using Vite, React Router, and Tailwind CSS

Has two main pages:

HomePage: Handles wallet connection and initial user interaction

AccountPage: Manages account operations with modals for deposit, withdraw, register, and tip actions

Uses ethers.js to interact with the Westend Asset Hub blockchain

Responsive design with both light/dark mode support

The project appears to be set up for deployment on Netlify with automatic build processes that include compiling the smart contracts before building the frontend.

Initial Wallet Connection ( src/lib/ethersProvider.ts):
src/lib
import { BrowserProvider } from "ethers";
export const ethersProvider = window.ethereum ? new BrowserProvider(window.ethereum) : null;
Wallet Connection Flow ( src/pages/HomePage.tsx):
Checks for MetaMask presence
Switches to Asset-Hub Westend Testnet (chainId: 420420421)
Adds the network if not present
Requests account access
Navigates to account page on success
Account Operations ( src/pages/AccountPage.tsx):
Initializes signer: const signer = await ethersProvider.getSigner()
Fetches wallet balance: ethersProvider.getBalance(address)
Loads identifier balances from contract
Manages multiple modal components for different operations
Contract Interactions through modals:
Deposit ( src/components/DepositModal.tsx):

Loads user's identifiers
Converts amounts to Wei: ethers.parseEther(amount)
Calls contract's deposit function with fees
Withdraw ( src/components/WithdrawModal.tsx):

Loads available identifiers
Converts identifier to bytes32: ethers.encodeBytes32String(selectedIdentifier)
Handles withdrawal with fees
Register ( src/components/RegisterModal.tsx):

Validates wallet address: ethers.isAddress(walletAddress)
Converts identifier to bytes32
Registers identifier-wallet mapping
Tip ( src/components/TipModal.tsx):

Loads sender's identifiers
Converts both identifiers to bytes32
Processes tip with amount in Wei


### Monitor Bot

In the `bot` folder.

A Bluesky bot that monitors mentions for tip commands
Key functionalities:
Watches for /tip [amount] commands in mentions
Processes /register [wallet] commands for wallet registration
Automatically marks notifications as read
Implements robust error handling and auto-recovery
Uses pagination to handle multiple pages of notifications
Connects to both Bluesky API and the smart contract
Runs continuously with automatic restart capability via start.sh

### Smart Contract Details

Manages the core tipping functionality on the Westend Asset Hub chain
Key features:
Maps social media identifiers to wallet addresses
Handles deposits and withdrawals with configurable fees
Supports tipping between users
Role-based access control (owner and managers)
Security features like reentrancy protection
Deployed on Westend Asset Hub (chainId: 420420421)
Includes comprehensive event logging for transactions

## Presentation

[Presentation Video]()

[Presentation Slides on Canva]()


# Submission requirements ✅-List

1. [X] Be built with smart contracts on Polkadot Asset Hub

<img width="544" alt="Screenshot 2025-04-27 at 5 50 49 AM" src="https://github.com/user-attachments/assets/878c02ad-52e9-4c32-92ad-0f4ba06740df" />

Contract Address: 0x888175972F6570894e7CA8F1cAe817047c9Ba835

Code: [Tip.sol](https://github.com/bigtippers/supertip/blob/main/solidity/contracts/Tip.sol)

Deployed (via REMIX): [https://blockscout-asset-hub.parity-chains-scw.parity.io/address/0x888175972F6570894e7CA8F1cAe817047c9Ba835](https://blockscout-asset-hub.parity-chains-scw.parity.io/address/0x888175972F6570894e7CA8F1cAe817047c9Ba835)

2. [X] Be open source (and remain available as open source)

Released under [AGPLv3.0 or later](https://github.com/bigtippers/supertip/blob/main/LICENSE). 

3. [X] Include a short summary (<150 chars)

Supertip brings token tipping to **<u>any social media supporting decentralized identities</u>**. 

See [Intro](#supertip) for more.

4. [X] Include a full description (the problems it solves, how Polkadot was used to achieve it)

See [Intro](#supertip).

5. [ ] Include a technical description (what SDKs were used, and what features of Polkadot made this uniquely possible)

See [Technical Details](#technical-details).

6. [ ] Include a link to the Canva slides used in the presentation (including a slide on your team, problem, solution etc). You must use Canva for your presentation (yes, this is a requirement).

See [Presentation](#presentation)

7. [X] (For coding submissions) Have a custom (not boilerplate) smart contract on Polkadot Asset Hub (and committed to your GitHub repo). All of this must be fully-functioning, as evidenced in a demo video on your README (see point 8 below).


8. [ ] (For coding submissions) Include a clear README on your GitHub repo explaining how your project works. This README must include:

    1. [ ] A demo video - See [Demo Video](#demo-video)

    2. [ ] Screenshots of your UI - See [Screenshots](#screenshots)

    3. [ ] Description of how your smart contract works - See [Smart Contract Details](#smart-contract-details)

    4. [ ] A video with audio (e.g. a Loom video [like this](https://youtu.be/ZLKR4zE1o6U?si=6na7139wlVNkmJRa)) explaining how your project works, how the GitHub repo is structured, a demo of everything working etc. This is vital, so that the judges can review your project properly. Make sure you explain clearly how you satisfied point 7 above. This is a great example of a winning Polkadot project’s README: https://github.com/jjjutla/melodot. Bonus points for if your video is well-edited! - See [Presentation](#presentation)

    5. [X] Block explorer link for deployed smart contract on Asset Hub - Deployed (via REMIX): [https://blockscout-asset-hub.parity-chains-scw.parity.io/address/0x888175972F6570894e7CA8F1cAe817047c9Ba835](https://blockscout-asset-hub.parity-chains-scw.parity.io/address/0x888175972F6570894e7CA8F1cAe817047c9Ba835)


- **PRESENTING STRUCTURE** | Follow this structure when presenting:
    1. First 30 seconds for each team member to introduce yourselves (which employer/university you’re from, which year, what you’re majoring in etc). **Make sure you have a team slide!**
    
    2. Next 30 seconds to explain the problem you’re solving
    
    3. Next 30 seconds to explain your solution and grand vision - show off how big this can get
  - Innovation and Originality: The novelty of the solution and its potential to disrupt or significantly improve upon existing services.
  - Impact Potential: The applicability and scalability of the solution in real-world scenarios, including its potential for adoption and the breadth of its impact on the target market or sector.

    5. Next 30 seconds showing off your demo - show off how much you achieved!
  - Usability and Design: The application's user experience and interface design, ensuring accessibility and ease of use for its intended audience.

    6. Next 30 seconds explaining how you used Polkadot in your project (For coding submissions) Technical Implementation: The robustness, security, and efficiency of the application’s codebase. Proper use of smart contracts and adherence to best practices in dApp development will be crucial.
    - Use of the Blockchain: Effective use of smart contracts on Polkadot Asset Hub in the solution, demonstrating an understanding of their benefits and limitations.
    
    7. Final 30 seconds on future roadmap and what you’ll do next
    - Feasibility: The practicality of implementing the solution and the clarity of the implementation plan.

Technical:
