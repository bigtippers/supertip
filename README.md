![Tippin' Dots](https://github.com/user-attachments/assets/e05f27c8-06a6-4e13-a558-0c9cc7de7780)

# Tippin' Dots by the BigTippers

This is the source repository for the April 2025 Harvard EasyA Hackathon submission of the Tippin' Dots project by the Bigtippers.

Tippin' Dots brings tipping token functionality to **<u>any social media supporting decentralized identities</u>** (DIDs). 
Tipping tokens allow users to send small "tips" in the token currency to their favorite creators, 
allowing for micropayments and providing monetization options for creators beyond those provided by the traditional advertising model. 
Tipping creates a more rich and interactive experience for audiences by creating direct financial connections and incentives with creators.

Unlike platform-specific solutions, Tippin' Dots works across the growing ecosystem of decentralized social networks, 
including [Bluesky](https://bsky.app) and [Frequency](https://frequency.xyz). Inspired by the innovative
[open tipping tokens protocol](https://github.com/degen-token/DIPs/blob/main/dip-0002.md), our implementation extends these 
capabilities to create a unified tipping experience regardless of where content appears.

Tippin' Dots keeps users *inside of their own ecosystem*, using replies and direct messages inside of the apps they already
know and love to send tips and run tipping campaigns. Our approach avoids the "activation energy" problem entirely for users to 
participate. They only need to use specialized interfaces to fund and withdraw from their tipping accounts.

DIDs are the linchpin that makes our approach viable. They enable a trust model where verification does not depend on 
centralized authorities - instead, a cryptographic proof can be independently verified by anyone. This independent verification
is extended directly to a smart contract in our model. Allowing users to control ownership and secure their tipping pools even without
a pre-established cryptographic wallet.

In our implementation, we used Polkadot's smart contract functionality to integrate with Bluesky, with additional plans for Frequency.
The demo shows the entire UX from tipping someone to registering a wallet and withdrawing funds, with additional UX (tipping pools, automated rewards distributions, etc)
being relatively straightforward to implement in the current model without changing the underlying smart contract as currently implemented.

Our smart contract is designed to be extended to work with different types of DIDs by adding a registration function for each 
different type of DID. The contract lazily maps those DIDs to crypto wallets when users if users choose to deposit or withdraw funds. Because both
Bluesky and Frequency have similar DID functionalities, the path to complete full signature verification is similarly direct.

We believe that Tippin' Dots can help creators build sustainable income streams directly from their most engaged fans that eliminate all middlement,
while audiences gain new ways to recognize and reward exceptional content. Tippin' Dots builds a more connected, creator-friendly web where value
flows to those who truly deserve it.

## Demo Video

[![Watch the video](https://img.youtube.com/vi/9gQXEzlPyBc/maxresdefault.jpg)](https://youtu.be/9gQXEzlPyBc)


https://www.youtube.com/watch?v=9gQXEzlPyBc

## Screenshots

### Tipping!
<img width="600" alt="Tipping" src="https://github.com/user-attachments/assets/4052390e-763b-4f9c-94cb-c37163f38d28" />

### The Monitor Bot Seeing and Recording the Tip
![photo_2025-04-27_09-42-34](https://github.com/user-attachments/assets/e6f5f8b9-2f42-48e2-9b55-4a53f15563f8)


### WebUI View for Manager on app.bigtippers.net
<img width="175" alt="WebUI Manager View" src="https://github.com/user-attachments/assets/00fcfd26-e8de-4cb4-a46a-5cc0af3109fe" />

### Deposit Workflow
<img width="175" alt="WebUI Before Deposit" src="https://github.com/user-attachments/assets/81421b6b-f435-450e-8b8d-b50e013ad626" />
<img width="175" alt="Deposit Screen" src="https://github.com/user-attachments/assets/6636a59f-88ff-40e9-82c3-558bba0b354f" />
<img width="175" alt="Confirmation" src="https://github.com/user-attachments/assets/8ef0ff1c-9ad5-4abf-ac94-bf5636ab93bd" />
<img width="175" alt="WebUI After Deposit" src="https://github.com/user-attachments/assets/680f84f0-ae30-4d00-ad8b-f5092639a21b" />

## Technical Details

<img width="757" alt="Screenshot 2025-04-27 at 7 40 02 AM" src="https://github.com/user-attachments/assets/9035fe49-de3c-4a48-bab9-cb5f180936c9" />

Users primarily interact through social media interactions. To withdraw or deposit, they need to use the [Web UI](https://app.bigtippers.net).
All User social media interactions are processed by the Monitor Bot, and all financial transactions and wallet associations are handled by the smart contract. 

Layout:
- `src` the Web UI.
- `bot` the bot code.
- `solidity` smart contract code.

### app.bigtippers.net UI

The [Web UI](https://app.bigtippers.net) is a Vite app using react-router and tailwindcss. The app has two main pages:

1. `src/pages/HomePage.tsx`: Handles wallet connection and initial user interaction
2. `src/pages/AccountPage.tsx`: Manages account operations with modals for deposit, withdraw, register, and tip actions. There is also an admin panel visible by managers.

To interact with the Asset Hub blockchain smart contract, we use ethers.js with the following configuration:

```
{
            chainId: chainIdHex,
            chainName: "Asset-Hub Westend Testnet",
            nativeCurrency: {
              name: "Westend",
              symbol: "WND",
              decimals: 18
            },
            rpcUrls: ["https://westend-asset-hub-eth-rpc.polkadot.io"],
            blockExplorerUrls: ["https://blockscout-asset-hub.parity-chains-scw.parity.io"]
}
```

Special care is taken to ensure the user's Metamask-compatible wallet is on the right network. 
We also use a responsive design with both light/dark mode support, but have only tested the dark mode version extensively.

To deploy this app, we use Netlify with automatic build processes. Because we use a smart contract, we include compiling the smart contracts before building the frontend in that process using a `prebuild` command. The rest of the build process follows the standard `build` -> `deploy` strategy.

Layout:
- `src/lib`, Library code.
- `src/pages`, main pages.
- `src/components`, modals and other UI widgets.

The overall design of the WebUI is a simple wallet with Withdraw, Deposit, and Tip functions. We had planned to permit login via OAUTH on Frequency and Bluesky, but they required a lot of extra infrastructure that was not feasible to set up. This exposed a hole in our expectations that the web apps themselves would forward any proofs of identity to us and NOT our infrastructure. We were surprised to discover that both Frequency and Bluesky have webhooks that appear to require server-side processing first, and both included language that implied exposing that to the client was a security or privacy concern!

### Monitor Bot

The monitor is a Bluesky bot that monitors mentions for tip commands. It's key functionalities include:
1. Watching for `/tip [amount` commands in mentions
2. Processing `/register [wallet]` commands for wallet registration

It also automatically marks notifications as read implements robust error handling and auto-recovery as a long-running process.
For large numbers of notifications, it uses pagination. It connects to both the BlueSky API and the Smart Contract. It holds
a private key of a manager so it can process tips and register wallets to users.

A number of additional functions were planned:
1. `/pool [amount] [type] [timeout]` to incentivize interaction on a thread. The `type` would control if payouts were based on likes by
    the owner, total likes, or some other system.
3. `/letitrain [amount] [type]` which gives out tips to anyone who interacts with a post or via other rules controlled by `type`.
4. `/challenge [amount] [type]` A payout that only happens when a certain challenge is met (e.g., # of likes).

For obvious reasons of time, we kept it simple. We think it is pretty straighforward how one might implement these given the existing functionality. 

Right now the Monitor Bot validates user identities by receiving notifications of messages and the smart contracts privileges them to 
make wallet to DID connections (i.e., semi-trusted manager model). A full DID signature check requires additional work, which is 
entirely possible but did not have sufficient documentation or examples to do in the timeframe of a hackathon given the 
complexity of our smart contract. We also had planned to make the DID associations private but decided to punt on that for usability for now. 

The bot itself was the most challenging component to build. The tooling for monitoring was not well documented and included subtle bugs, 
and we spent over 6 hours resolving an issue where the monitor would authenticate then tell us we no longer had a proper access token.

### Smart Contract Details

We believe, except for signature checking, that the `Tip.sol` smart contract can be considered fully featured, with the following functionality:
1. Maps social media DIDs to wallet addresses AND reverse maps wallet address to 1 or more social media DIDs.
2. Handles deposits with a deposit fee and withdrawals with a withdrawal fee, all of which can be collected by the owner.
3. Supports tipping between users directly as well as via the `owner` and `manager` roles.
4. Role-based access control (`owner` and one or more `managers`).
5. Ability to add and remove `managers` and ability to transfer ownership.
6. Ability for users to transfer to new wallets. **Managers lose the ability to set wallet mappings after a user asserts ownership.**
7. Proper security features like reentrancy protection.
8. Comprehensive event emissions for all important transactions.

We deployed on the Westend Asset Hub (chainId: 420420421) via the REMIX client provided by polkadot.  
We can implement per network DID signature checks by adding a single function, e.g., `registerWithBlueSky` function 
which performs that check. We believe it is possible to perform the check using the existing built-ins precompiles and, 
given the superior efficiency of the PolkaVM system, that our implementation will likely be as cheap or cheaper 
that most other EVM chains (and definitely cheaper than other chains of similar levels of decentralization!). 

## Presentation

[Presentation Video Part 1](https://www.loom.com/share/b49a76a6b17e47bf93b5b6a47cd72ca0?sid=13a8dba5-b244-4e04-b1ee-00e28eef097f)
[Presentation Video Part 2](https://www.loom.com/share/5b0c8134f5fe4e01b6fd7cec1ec1a5fa?sid=9a732f9b-29a9-427e-a625-307fe10d0685)
[Presentation Video Part 3](https://www.loom.com/share/e29bbd4e74544383923a1c174f7b25e5?sid=77d41919-6dfc-4eae-988b-0d8e799e7ae2)


[Presentation Slides on Canva](https://www.canva.com/design/DAGlyma_LwA/wz8Ip1qao2xrSLXyuOOzUw/view?utm_content=DAGlyma_LwA&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hbcb4acd01b)


# Submission requirements ✅-List

1. [X] Be built with smart contracts on Polkadot Asset Hub

<img width="544" alt="Screenshot 2025-04-27 at 5 50 49 AM" src="https://github.com/user-attachments/assets/878c02ad-52e9-4c32-92ad-0f4ba06740df" />

Contract Address: 0x888175972F6570894e7CA8F1cAe817047c9Ba835

Code: [Tip.sol](https://github.com/bigtippers/supertip/blob/main/solidity/contracts/Tip.sol)

Deployed (via REMIX): [https://blockscout-asset-hub.parity-chains-scw.parity.io/address/0x888175972F6570894e7CA8F1cAe817047c9Ba835](https://blockscout-asset-hub.parity-chains-scw.parity.io/address/0x888175972F6570894e7CA8F1cAe817047c9Ba835)

2. [X] Be open source (and remain available as open source)

Released under [AGPLv3.0 or later](https://github.com/bigtippers/supertip/blob/main/LICENSE). 

3. [X] Include a short summary (<150 chars)

Tippin' Dots brings token tipping to **<u>any social media supporting decentralized identities</u>**. 

See [Intro](#tippin-dots) for more.

4. [X] Include a full description (the problems it solves, how Polkadot was used to achieve it)

See [Intro](#tippin-dots).

5. [X] Include a technical description (what SDKs were used, and what features of Polkadot made this uniquely possible)

See [Technical Details](#technical-details).

6. [X] Include a link to the Canva slides used in the presentation (including a slide on your team, problem, solution etc). You must use Canva for your presentation (yes, this is a requirement).

See [Presentation](#presentation)

7. [X] (For coding submissions) Have a custom (not boilerplate) smart contract on Polkadot Asset Hub (and committed to your GitHub repo). All of this must be fully-functioning, as evidenced in a demo video on your README (see point 8 below).


8. [X] (For coding submissions) Include a clear README on your GitHub repo explaining how your project works. This README must include:

    1. [X] A demo video - See [Demo Video](#demo-video)

    2. [X] Screenshots of your UI - See [Screenshots](#screenshots)

    3. [X] Description of how your smart contract works - See [Smart Contract Details](#smart-contract-details)

    4. [X] A video with audio (e.g. a Loom video [like this](https://youtu.be/ZLKR4zE1o6U?si=6na7139wlVNkmJRa)) explaining how your project works, how the GitHub repo is structured, a demo of everything working etc. This is vital, so that the judges can review your project properly. Make sure you explain clearly how you satisfied point 7 above. This is a great example of a winning Polkadot project’s README: https://github.com/jjjutla/melodot. Bonus points for if your video is well-edited! - See [Presentation](#presentation)

    5. [X] Block explorer link for deployed smart contract on Asset Hub - Deployed (via REMIX): [https://blockscout-asset-hub.parity-chains-scw.parity.io/address/0x888175972F6570894e7CA8F1cAe817047c9Ba835](https://blockscout-asset-hub.parity-chains-scw.parity.io/address/0x888175972F6570894e7CA8F1cAe817047c9Ba835)

