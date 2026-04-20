`The compiled list of features on more emphasis on non working one. The intent is to fix all the non working features`

#### Feature report

- ✅ [#Frontend](#Frontend) Signup & Signin process is flawless (passkey, magic link, password )
- ✅ [#Frontend](#Frontend) Payment link working...
- [#Frontend](#Frontend) Chain is Required for ONRAMP [#patrick](#patrick)
- ✅ [#Frontend](#Frontend) Change "Prepare on-chain payment" -> "Confirm Payment" -> with a bigger button [#kaleel](#kaleel)
- [#Frontend](#Frontend) After continue to Pay, a new tab showing "Pay with your wallet" [#kaleel](#kaleel)
- ✅ [#Frontend](#Frontend) Checkout Disconnect wallet not working. [#patrick](#patrick)
- ✅ [#Frontend](#Frontend) Balance never finish loading. [#patrick](#patrick)
- [#Frontend](#Frontend) RECEIVER: Payer transfers from his wallet instead of transferring to his own wallet (REASON WAS GIVEN) [#kaleel](#kaleel)
- ✅ [#Frontend](#Frontend) Placeholder too LARGE, input text proportionally small [#kaleel](#kaleel)
- ✅ [#Frontend](#Frontend) Placeholder & input text color not visible [#kaleel](#kaleel)
- [#Frontend](#Frontend) Generate link, no need for user to select Send link options. [#kaleel](#kaleel)
- [#Frontend](#Frontend) bottom sheet border needs to be removed. [#kaleel](#kaleel)
- ✅ [#Frontend](#Frontend) Select token modal too big for desktop screen. (*max width:* ) [#kaleel](#kaleel)
- [#Frontend](#Frontend) Fiat tab revamp [#kaleel](#kaleel)
- [#Frontend](#Frontend) Close Button for bottom sheet not working. [#kaleel](#kaleel)
- [#Frontend](#Frontend) Preparing an onchain transaction & Sign & Send to pool -> can be one process (one button click). [#kaleel](#kaleel)
- ✅ [#LightMode](#LightMode) [#Frontend](#Frontend). Balance, Chain name, and amount text color in light mode not visible. [#kaleel](#kaleel)
- Wallet name, and actions not visible
- Price to company name not visible
- Transfer page amount, Receiver,
- ✅ [#Frontend](#Frontend) "More tokens" button hover color doesn't follow page format [#kaleel](#kaleel)
- [#Frontend](#Frontend) Chain listing in select token modal should be a horizontal scroll only. [#kaleel](#kaleel)
- ✅ [#LightMode](#LightMode) [#Frontend](#Frontend) Selected text on "Receive" page's "I want to receive" not visible. [#kaleel](#kaleel)
- [#BusinessPage](#BusinessPage) Settlement / Payout page not loading. [#kaleel](#kaleel)
- [#BusinessPage](#BusinessPage) Merchant API mode (Test, live) toggle is confusing to me. [#patrick](#patrick)
- [#BusinessPage](#BusinessPage) NO Notification page [#patrick](#patrick)
- [#BusinessPage](#BusinessPage) NO Product page [#kaleel](#kaleel)
- ✅#BusinessPage Duplicate Business name on topnav [#kaleel](#kaleel)
- ✅#BusinessPage Active search input bg color is white (should be PRIMARY_HEX_COLOR) [#kaleel](#kaleel)
- ✅#BusinessPage: Settings information using default hardcoded values. [#patrick](#patrick)
- Gas sponsorship page
- Team shows signin to your business acc.
- [#BusinessPage](#BusinessPage) Payment link Status should contain, active, paid, inactive/expired, pending. [#NewFeature](#NewFeature)
- [#BusinessPage](#BusinessPage) Payment Link webhook for awaiting transactions. [#NewFeature](#NewFeature)
- ✅#BusinessPage Payment link table footer needs spacing. [#kaleel](#kaleel)
- [#BusinessPage](#BusinessPage) Dashboard / Home page should list top 10 transactions & Payouts (just like on admin page) [#patrick](#patrick)
- ✅#BusinessPage Dashboard / Home Page reporting shows KYB status (KYB: NOT_STARTED) is a turnoff [#kaleel](#kaleel)
- ✅#BusinessPage Products route to Inventory [#kaleel](#kaleel)
- ✅#BusinessPage Payment Links messaging & spacing is a mess [#kaleel](#kaleel)
- ✅#BusinessPage Invoice show auth error even tho I am logged in. [#kaleel](#kaleel)
- edit invoice, edit notes, cancel invoice, duplicate,
- ✅#BusinessPage API page Key rotation scheduled, is it a feature? [#kaleel](#kaleel) [#patrick](#patrick)
- ✅#BusinessPage Topnav Component Toggle between live and test should require confirmation. [#kaleel](#kaleel)
- ✅#BusinessPage Topnav should hide some components in mobile screen/view. [#kaleel](#kaleel)
- ✅[#BusinessPage](#BusinessPage) Payment link search button not working.
- [#BusinessPage](#BusinessPage) Topnav, sidebar/ headernonav search is not working.
- ✅#BusinessPage ActionTooltip for showing actions (copy, qr code generated)
- ✅[#BusinessPage](#BusinessPage) Link KYC & KYC on settings page
- ✅[#BusinessPage](#BusinessPage) QR Code modal needs revamping.



- the balances lets write a script that we can use to get the balances, so currentrly how we are fetchig balances for the tokens for wallet addresses some are failing so what i want to do is that i want to have a script that does the balance fetch but then i see which RPC was used and in this case i see we use multical and squid but if its possible to determine which rpc was used to fetch the balance for the chain then i will be able to now find and replaece rpcs that are not fetching the baalnces so the scrupt givine an address then it runs a balnce check that checks balance like one chain at a time or baseed on how we fetch balances cureently we us ethat but then try to get the RPC that was used thats all because if i use an RPC and then it fetches tokens for a chain but then and also there is another issue so lets say we connect a wallet like metamask it would be easier to get assets from the wallet with their balances is it nnot because if its not posibel to queiry the wallet to get what assets it hold then our current systme of self fetching makes sense but if we cna fetch assets from the connected wallet then it means any wallet at all a user connects we can get the address of that wallet and also get the assets and right now we are a bit limited because if we use an evm wallet address to try to get token baalnce on solana its definitey not working cause it wont work but then unless we have the chain equivalent address for the wallet token fetches will still be an issue so the original issue does not stem directly from the RPC so lets take a detoru first before going to do the RPC part

I'll search the documentation for information on checking balances across multiple chains and tokens.Use the `useMultichainTokenBalances` hook from `@dynamic-labs/sdk-react-core` to fetch token balances across multiple chains and networks:

```tsx
import { useMultichainTokenBalances, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { ChainEnum } from '@dynamic-labs/sdk-api-core';

const { primaryWallet } = useDynamicContext();

const { multichainTokenBalances, isLoading } = useMultichainTokenBalances({
  filterSpamTokens: true,
  requests: [
    {
      address: primaryWallet?.address || '',
      chain: ChainEnum.Evm,
      networkIds: [1, 137, 56], // Ethereum, Polygon, BNB
    },
  ],
});
```

Balances are cached for 15 seconds by default. For a single chain, use `useTokenBalances` instead.

```suggestions
(Multichain Balances)[/react/wallets/using-wallets/general/show-balance]
(Token Balances Reference)[/react/reference/token-balances]
```

this is dynamics multitoken chain balance check lets give it a try although we have already set it up and its conditioned to render if the other checks fial like if bakcend did not get the baallacne we use the dynamic and if it fetches then thats what shows wwe have this just need to check on it perhaps and also the thing about the addresses so if the metamask like this we can get the connected wallets solana addresss tron address bitcoin address then it means balance fetches for these giuys arent going to be so hard and then other waallets like phantom OKX who also supports similar thing and gives addrresses for the respective chains so this means that we should be trying to get the chains supported by the wallet that has been connected and get the address of the wallet on that wallet on all possible chains so this means if we connect to say an aptos wallet or stellar wallet definitly we wont get base network for sure but then if its a wallet that supports then it means we will be able to get the data we need, so here we are not doing mocks for anything we ned to directly be abke to fetch the data from the connected wallets otherwise it will be an issue so it would mean now when i connect metamask i should be able to see the solana address of that wallet that metamask has or any other chains that dont use the evm address so if metamask supports then cool but otherwise then it just means i have to go comnnect the other wallet and thats the best we can do


> ## Documentation Index
> Fetch the complete documentation index at: https://www.dynamic.xyz/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Gas Sponsorship Setup

> Let your users forget about gas fees and focus on your app.

<Card title="Dynamic Gasless Starter">
  Want to see smart wallets in action? Check out our [Dynamic Gasless Starter](https://github.com/dynamic-labs/examples/tree/main/starters/nextjs-evm-gasless-zerodev) - a Next.js demo that showcases gasless transactions with email-based wallet creation and token minting, all without users paying gas fees.
</Card>

## Quickstart

### Prerequisites

* Create a Zerodev account and projects for each network you want to support, as well as a gas policy for each one. Make sure you use [the V1 dashboard](https://dashboard.zerodev.app/create-legacy-project) to configure your project.
* Visit the [Sponsor Gas section of the dashboard](https://app.dynamic.xyz/dashboard/smart-wallets), toggle on Zerodev and add your project IDs.

### Configure Your SDK

Install the package:

<Tabs>
  <Tab title="npm">
    ```bash Shell theme={"system"}
    npm install @dynamic-labs/ethereum-aa
    ```
  </Tab>

  <Tab title="yarn">
    ```bash Shell theme={"system"}
    yarn add @dynamic-labs/ethereum-aa
    ```
  </Tab>

  <Tab title="pnpm">
    ```bash Shell theme={"system"}
    pnpm add @dynamic-labs/ethereum-aa
    ```
  </Tab>

  <Tab title="bun">
    ```bash Shell theme={"system"}
    bun add @dynamic-labs/ethereum-aa
    ```
  </Tab>
</Tabs>

## Advanced Usage

You can find more advanced usage examples in our [advanced usage](/react/smart-wallets/advanced) guide.

<Tip>
  Using server wallets? See [Sponsor Gas for Server Wallets (EVM)](/node/wallets/server-wallets/gas-sponsorship). Using Solana embedded wallets? See [SVM Gas Sponsorship](/react/smart-wallets/svm-gas-sponsorship).
</Tip>

## Note on 7702

EIP-7702 is the default for enabling gas sponsorship using Dynamic & Zerodev, but you can switch back to 4337 if you want using the dashboard settings.

### Why use 7702?

EIP-7702 introduces a new transaction type that allows a wallet to delegate execution to an address with a deployed smart account. This means:

* No need to switch or manage multiple accounts and wallets.
* Users retain their existing EOA and gain smart account functionality.
* The transition is smooth and invisible to the end user.

### Common questions

* Do all chains/networks support 7702?
  No, not all chains/networks support 7702. You can see a list of chains/networks that support 7702 [here](https://swiss-knife.xyz/7702beat).

* When does the delegation (authorization) signing happen?
  The delegation authorization is signed automatically behind the scenes on the first transaction. If a paymaster is used, the paymaster will pay for the transaction.

* How long does the delegation remain active?
  The delegation stays active until the user delegates to a new address.

* How does this work for existing EOAs (e.g. MetaMask)?
  At the moment, delegation is a feature exclusive to embedded wallets. That's because we need to sign the authorization in a very specific way that requires access to the private key. From what we've heard, external wallets like MetaMask are unlikely to expose the `signAuthorization` method, making it unclear how (or if) this flow will work with them.

### Resources

* [EIP-7702 Specification](https://eips.ethereum.org/EIPS/eip-7702)
* [ZeroDev Documentation](https://docs.zerodev.app/)
* [Ithaca Odyssey Testnet](https://www.ithaca.xyz/updates/odyssey)
* [Dynamic Dashboard](https://app.dynamic.xyz/dashboard)

## Using Other Providers

Dynamic supports a large number of providers and we have guides for each one:

<Columns cols={4}>
  <Card href="/react/smart-wallets/smart-wallet-providers/zksync">
    zkSync
  </Card>

  <Card href="/react/smart-wallets/smart-wallet-providers/alchemy">
    Alchemy
  </Card>

  <Card href="/react/smart-wallets/smart-wallet-providers/pimlico">
    Pimlico
  </Card>

  <Card href="/react/smart-wallets/smart-wallet-providers/biconomy">
    Biconomy
  </Card>

  <Card href="/react/smart-wallets/smart-wallet-providers/safe">
    Safe
  </Card>

  <Card href="/react/smart-wallets/smart-wallet-providers/rhinestone">
    Rhinestone
  </Card>

  <Card href="/react/smart-wallets/smart-wallet-providers/circle">
    Circle
  </Card>

  <Card href="/react/smart-wallets/smart-wallet-providers/crossmint">
    Crossmint
  </Card>
</Columns>



https://www.dynamic.xyz/docs/react/smart-wallets/smart-wallet-providers/circle

https://www.dynamic.xyz/docs/react/smart-wallets/smart-wallet-providers/pimlico

https://www.dynamic.xyz/docs/react/smart-wallets/smart-wallet-providers/rhinestone

https://www.dynamic.xyz/docs/react/smart-wallets/smart-wallet-providers/crossmint


using these information  provided here lets see which provider is the one that supports cross chain now i did configuire one on the dashboard for dynamic but then that one is more of a global wallet thing so iit attached to the entire dynamic environment but then its limited to only three providers and then  