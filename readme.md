# crypto-subscribe

A self-hosted crypto subscription billing system — Stripe Billing for on-chain payments. Vendors embed a hosted checkout page that lets users subscribe, pay, and manage their plan entirely with their crypto wallet.

Two implementations live in this repo:

| | New (this workspace) | Legacy (`recurring-crypto-payments/`) |
|---|---|---|
| Protocol | x402 + ERC-7715/ERC-7710 | Custom Solidity contracts |
| Network | Base mainnet (USDC) | Sepolia testnet (FakeUSDT) |
| Wallet | MetaMask Smart Accounts Kit | Web3.js + MetaMask |
| DB | Stubbed (TODO) | MongoDB Atlas |
| CRON | TODO | AWS Lambda + EventBridge |

---

## Table of contents

- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Buyer app](#buyer-app)
- [Seller API](#seller-api)
- [Shared packages](#shared-packages)
- [Payment flow (x402 + ERC-7715)](#payment-flow-x402--erc-7715)
- [Legacy implementation](#legacy-implementation)
- [Architecture decisions](#architecture-decisions)

---

## How it works

```
Vendor embeds a link:
  https://checkout.example.com/?authToken=<JWT>

User clicks → Buyer SPA loads
             → Fetches /api/subscription
             → Shows checkout UI
             → User clicks "Subscribe"
             → Wallet connects (Base mainnet)
             → requestExecutionPermissions()   ──► MetaMask wallet
             ← grantedPermissions              ◄── (user approves $5/month budget)
             → GET /api/pro (HTTP 402)          ──► Seller
             ← PAYMENT-REQUIRED header         ◄──
             → redelegatePermissionContext()    ──► MetaMask facilitator
             → GET /api/pro + PAYMENT-SIGNATURE ──► Seller
             ← 200 { ok: true }                ◄──
             → Subscription active
```

Subsequent months: the server calls the paid endpoint automatically using the stored `permissionContext` — no re-approval needed until the budget period resets or the permission expires.

---

## Project structure

```
crypto-subscribe/
├── apps/
│   ├── buyer/              # React 18 + Vite SPA — hosted checkout page
│   └── seller/             # Express 4 API server — payment middleware + subscription stubs
├── packages/
│   ├── lib/                # Shared TypeScript types, wallet utils, text helpers
│   └── ui/                 # Shared MUI components (Button, Modal, DisplayField, …)
├── recurring-crypto-payments/   # Legacy implementation (Solidity contracts + full stack)
├── package.json            # npm workspaces root
└── README.md
```

---

## Quick start

**Prerequisites:** Node 20+, npm 10+, MetaMask browser extension (for buyer flow)

```bash
# Install all workspace dependencies
npm install

# Start both apps in development mode (two terminals)
npm run dev:buyer    # http://localhost:5173
npm run dev:seller   # http://localhost:4402
```

Set up environment variables first — see [Environment variables](#environment-variables).

Open the buyer app with an auth token:

```
http://localhost:5173/?authToken=<your-jwt-token>
```

---

## Environment variables

### `apps/buyer` — create `apps/buyer/.env`

```env
VITE_API_URL=http://localhost:4402
VITE_SESSION_PK=0x<your-session-account-private-key>
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the seller API server |
| `VITE_SESSION_PK` | Private key for the intermediate session account used in ERC-7710 redelegation. Generate a fresh throwaway wallet — it never holds user funds. |

### `apps/seller` — create `apps/seller/.env`

```env
PORT=4402
TREASURY_ADDRESS=0x<your-wallet-address>
```

| Variable | Description |
|---|---|
| `PORT` | HTTP port for the Express server (default `4402`) |
| `TREASURY_ADDRESS` | EVM address that receives subscription payments |

---

## Buyer app

**Location:** `apps/buyer/`
**Stack:** React 18, Vite 5, TypeScript 5.4, MUI v5, Zustand 4, viem 2, `@metamask/smart-accounts-kit` 0.13

### Entry point

`src/App.tsx` — reads `?authToken=` from the URL (a JWT with `.` replaced by `~`), stores it in `localStorage`, fetches `GET /api/subscription`, and renders `<CheckoutPage>` when authenticated.

### Page layout

```
CheckoutPage
├── Sidebar                  — vendor name + "Return to vendor" link
└── ContentPanel
    ├── CurrentPlan          — status badge, plan name, amount, next renewal; opens modals
    ├── PaymentMethod        — wallet address, allowance/balance status, change-method button
    ├── BillingInfo          — name/email/address fields; update billing button
    └── InvoiceHistory       — list of past payments with Etherscan links
```

### Modals

| Modal | Trigger | Steps |
|---|---|---|
| `GrantBudgetModal` | "Subscribe" / "Renew" button | 1. Connect wallet → 2. Grant monthly budget (ERC-7715) → 3. Confirm subscription |
| `CancelPlanModal` | "Cancel plan" button | Single confirmation step; calls `POST /api/subscription/cancel` |

### State management

Two Zustand stores:

**`useSubscriptionStore`** — holds `SubscriptionDetails`, exposes `setDetails()` and `triggerRefresh()` to re-fetch from the API.

**`useModalStore`** — holds `activeModal` enum (`GRANT_BUDGET | CANCEL_PLAN | ADD_ALLOWANCE | UPDATE_BILLING`), exposes `open()` and `close()`.

### Core hook: `useGrantBudget`

`src/hooks/useGrantBudget.ts` — orchestrates the full ERC-7715 + x402 payment flow.

| Step | State | What happens |
|---|---|---|
| 1 | `connecting` | `eth_requestAccounts` + switch to Base mainnet |
| 2 | `granting` | `walletClient.requestExecutionPermissions()` — MetaMask shows approval dialog |
| 3 | `granted` | Permission object stored; billing info collected |
| 4 | `paying` | Fetch 402 challenge → redelegate to facilitator → send `PAYMENT-SIGNATURE` |
| 5 | `done` | Server confirmed; subscription marked active |

---

## Seller API

**Location:** `apps/seller/`
**Stack:** Express 4, TypeScript, `@x402/express`, `@metamask/x402`

### `GET /api/pro`

Protected by x402 middleware. Requires a $5.00 USDC payment on Base mainnet via ERC-7710.

**Unauthenticated response:**
```
HTTP/1.1 402 Payment Required
PAYMENT-REQUIRED: <base64-JSON>
```

**With `PAYMENT-SIGNATURE` header:**
```json
{ "ok": true, "plan": "pro" }
```

### `GET /api/subscription`

Returns the subscriber’s plan details. Authenticated via `Authorization: Bearer <JWT>`.

> **TODO:** Currently returns hardcoded stub data. Needs JWT validation and DB lookup.

**Response schema:**
```ts
{
  vendor: string
  plan: string
  amount: string            // e.g. "5"
  token: string             // e.g. "USDC"
  tokenAddress: string
  status: ‘active’ | ‘inactive’ | ‘cancelled’ | ‘ended’
  nextDate: string | null   // ISO date of next renewal
  paymentMethod: PaymentMethod | null
  billingInfo: BillingInfo | null
  invoices: Invoice[]
  permissionContext?: string
  delegationManager?: string
  delegatorAddress?: string
}
```

### `POST /api/subscription/cancel`

Cancels the subscription. Returns `{ ok: true }`.

> **TODO:** Needs JWT validation, DB update, and webhook dispatch.

### x402 middleware setup

```ts
const facilitatorClient = new HTTPFacilitatorClient({
  url: ‘https://tx-sentinel-base-mainnet.dev-api.cx.metamask.io/platform/v2/x402’,
})

app.use(paymentMiddleware(
  { ‘GET /api/pro’: { accepts: [{ scheme: ‘exact’, price: ‘$5.00’,
      network: ‘eip155:8453’, payTo: TREASURY_ADDRESS,
      extra: { assetTransferMethod: ‘erc7710’ } }] } },
  new x402ResourceServer(facilitatorClient)
    .register(‘eip155:8453’, new x402ExactEvmErc7710ServerScheme())
))
```

---

## Shared packages

### `@crypto-subscribe/lib`

**Location:** `packages/lib/`

#### Key types

```ts
interface SubscriptionDetails {
  vendor: string
  plan: string
  amount: string
  token: string               // display name, e.g. ‘USDC’
  tokenAddress: string        // ERC-20 contract address on Base
  status: ‘active’ | ‘inactive’ | ‘cancelled’ | ‘ended’
  nextDate: string | null
  paymentMethod: PaymentMethod | null
  billingInfo: BillingInfo | null
  invoices: Invoice[]
  permissionContext?: string  // base64 ERC-7710 delegation
  delegationManager?: string
  delegatorAddress?: string
}

interface PaymentMethod {
  token: string
  tokenAddress: string
  wallet: string
  sufficientAllowance: boolean
  sufficientBalance: boolean
}
```

#### Wallet utilities

```ts
BASE_USDC_ADDRESS   // ‘0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913’
BASE_CHAIN          // viem Base chain config
connectWallet()     // switch to Base + eth_requestAccounts
formatUsdc(raw)     // bigint → ‘1.00’ (6 decimals)
parseUsdc(human)    // ‘1.00’ → 1_000_000n
shortenAddress(a)   // ‘0x1234…abcd’
```

### `@crypto-subscribe/ui`

**Location:** `packages/ui/`

| Component | Description |
|---|---|
| `CustomButton` | MUI Button with animated spinner when `loading=true` |
| `CustomModal` | Centered MUI Modal with title bar and optional backdrop-lock |
| `LoadingOverlay` | Full-screen backdrop + circular progress |
| `TextWithTooltip` | Shows shortened address with full address in tooltip |
| `DisplayField` | Read-only field with copy button and optional sensitive-value toggle |

---

## Payment flow (x402 + ERC-7715)

### Protocols

**[x402](https://github.com/coinbase/x402)** — An HTTP payment protocol. Server returns `402` with a `PAYMENT-REQUIRED` header; client pays and retries with `PAYMENT-SIGNATURE`. Settlement is done by a facilitator service, not the server.

**[ERC-7715](https://eips.ethereum.org/EIPS/eip-7715)** — Lets a user grant a session account a delegated permission: "spend up to X tokens per period on my behalf." One approval, many payments.

**[ERC-7710](https://eips.ethereum.org/EIPS/eip-7710)** — On-chain delegation. The session account redelegates a narrowed permission to the facilitator contract, which executes the token transfer.

### Full sequence

```
1. User approves subscription
   walletClient.requestExecutionPermissions([{
     type: ‘erc20-token-periodic’,
     tokenAddress: BASE_USDC_ADDRESS,
     periodAmount: parseUnits(‘5’, 6),
     periodDuration: 30 * 24 * 3600,
     startTime: now,
   }])
   → MetaMask shows approval dialog
   ← { context, delegationManager, from }

2. Buyer probes the protected endpoint
   GET /api/pro
   ← 402 + PAYMENT-REQUIRED header (base64 JSON)

3. Buyer parses challenge, validates:
   - assetTransferMethod === ‘erc7710’
   - accepted.asset === BASE_USDC_ADDRESS

4. Buyer redelegates to facilitator
   sessionAccountWalletClient.redelegatePermissionContext({
     permissionContext: granted.context,
     scope: { type: Erc20TransferAmount, maxAmount: accepted.amount },
     caveats: [{ type: Redeemer, redeemers: facilitators }],
   })
   ← { permissionContext }  (narrowed, single-payment delegation)

5. Buyer sends payment
   GET /api/pro
   PAYMENT-SIGNATURE: base64({
     x402Version: 2, accepted,
     payload: { delegationManager, permissionContext, delegator }
   })
   ← 200 { ok: true }
```

### Security properties

- **User-controlled budget:** The user explicitly approves amount, token, and period in MetaMask before any payment occurs.
- **Session key holds no funds:** `VITE_SESSION_PK` signs the redelegation only. The user’s USDC stays in their MetaMask wallet.
- **On-chain cap enforcement:** The periodic budget limit is enforced by the MetaMask delegation framework on Base, not by trusting the vendor server.
- **Expiring grants:** Each `requestExecutionPermissions` call has an `expiry`. The user must re-approve after it lapses.

---

## Legacy implementation

`recurring-crypto-payments/` is the original production system on Sepolia testnet with custom Solidity contracts.

**Smart contracts (Sepolia):**

| Contract | Address |
|---|---|
| `RecurringPayments` (master) | `0x8880DA75707ea777c0bdFBbF679b56cfac41a7d7` |
| `RecurringPaymentsVendor` (example) | `0x6f4E72BF6F989656a9B9C4F4271ce1d47CCDb9A4` |
| `FakeUSDT` | `0xC9606fea595Ed3a94B4c8548ca0C2252C7856E89` |

**Webhook events:**

| Event | Trigger |
|---|---|
| `SUBSCRIPTION_BEGUN` | User subscribes successfully |
| `SUBSCRIPTION_CANCELLED` | User cancels |
| `SUBSCRIPTION_RENEWED` | Monthly CRON payment succeeds |
| `SUBSCRIPTION_ENDED` | Plan ends |
| `SUCCESSFUL_PAYMENT` | Individual payment collected |
| `FAILED_PAYMENT` | Payment attempt failed |

**Infrastructure:** Render.com (server), Firebase Hosting (two SPA sites), MongoDB Atlas, AWS Lambda + EventBridge (CRON).

---

## Architecture decisions

**Why x402 + ERC-7715 over a pull-payment contract?**

Traditional recurring crypto billing requires users to set an unlimited ERC-20 allowance on a vendor contract and trust the vendor to pull the right amount at the right time. With ERC-7715, the periodic budget cap is enforced on-chain by the MetaMask delegation framework. The vendor cannot charge more than the user approved per period, and the user can revoke at any time from their wallet.

**Why a session account?**

ERC-7710 redelegation requires signing. The user’s MetaMask key can’t sign headlessly, so a server-controlled session account holds the permission context and signs the narrowed delegation to the facilitator. This key never holds USDC — it’s a signing key only.

**Why Base mainnet + USDC?**

Base has sub-cent gas fees, making $5/month subscriptions economically viable. USDC is the dominant stable on Base with deep liquidity and native issuer support.

**Why JWT-in-URL for the checkout link?**

The checkout page is embedded by vendors in their own flows. Passing a short-lived JWT as a query param avoids requiring the buyer to maintain a separate session. The `.` → `~` substitution avoids URL encoding issues in some redirect contexts. Tokens should be short-lived (15–60 minutes) since they’re visible in browser history.

---

## Reference: original x402 + ERC-7715 example

## Buyer side

- This example requests permission to spend up to 10 USDC every 30 days. MetaMask’s docs show `requestExecutionPermissions()` with `type: 'erc20-token-periodic'`, including `tokenAddress`, `periodAmount`, `periodDuration`, and `startTime`. [projectai](https://projectai.in/projects/48ca0dea-f93c-417c-adbb-42e0e67c41c6/tasks/ce6b83df-b874-47c6-8681-6044e57fa057)
- The x402 buyer flow then fetches the protected endpoint, reads the `PAYMENT-REQUIRED` challenge, redelegates the permission to the facilitator, and sends a base64 `PAYMENT-SIGNATURE` payload. [projectai](https://projectai.in/projects/48ca0dea-f93c-417c-adbb-42e0e67c41c6/tasks/ce6b83df-b874-47c6-8681-6044e57fa057)

```ts
// buyer.ts
import { createWalletClient, custom, createPublicClient, http, parseUnits } from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import {
  erc7715ProviderActions,
  erc7710WalletActions,
} from '@metamask/smart-accounts-kit/actions'
import {
  getSmartAccountsEnvironment,
  ScopeType,
  CaveatType,
} from '@metamask/smart-accounts-kit'

const chain = base
const environment = getSmartAccountsEnvironment(chain.id)

// 1) MetaMask-connected browser wallet client
const walletClient = createWalletClient({
  chain,
  transport: custom(window.ethereum!),
}).extend(erc7715ProviderActions())

// 2) Session/agent account that will use the granted permission
const sessionAccount = privateKeyToAccount(process.env.NEXT_PUBLIC_SESSION_PK as `0x${string}`)

const sessionAccountWalletClient = createWalletClient({
  account: sessionAccount,
  chain,
  transport: http(),
}).extend(erc7710WalletActions())

const tokenAddress = '0xUSDC_ON_BASE'
const now = Math.floor(Date.now() / 1000)
const thirtyDays = 60 * 60 * 24 * 30

export async function grantMonthlyBudget() {
  const grantedPermissions = await walletClient.requestExecutionPermissions([
    {
      chainId: chain.id,
      expiry: now + thirtyDays,
      to: sessionAccount.address,
      permission: {
        type: 'erc20-token-periodic',
        data: {
          tokenAddress,
          periodAmount: parseUnits('10', 6), // 10 USDC
          periodDuration: thirtyDays,        // monthly budget window
          startTime: now,
          justification: 'Monthly subscription payment for API access',
        },
        isAdjustmentAllowed: false,
      },
    },
  ])

  return grantedPermissions[0]
}

export async function callPaidApi() {
  const granted = await grantMonthlyBudget()

  if (!granted) throw new Error('No permission granted')

  // 3) Ask server for x402 payment requirements
  const challenge = await fetch('https://api.example.com/api/pro')
  if (challenge.status !== 402) throw new Error('Expected 402 challenge')

  const paymentRequiredHeader = challenge.headers.get('PAYMENT-REQUIRED')
  if (!paymentRequiredHeader) throw new Error('Missing PAYMENT-REQUIRED header')

  const paymentRequired = JSON.parse(
    Buffer.from(paymentRequiredHeader, 'base64').toString('utf-8')
  )

  const accepted = paymentRequired.accepts?.[0]
  if (!accepted) throw new Error('No accepted payment terms')
  if (accepted.extra?.assetTransferMethod !== 'erc7710') {
    throw new Error('Server does not support ERC-7710')
  }
  if (accepted.asset.toLowerCase() !== tokenAddress.toLowerCase()) {
    throw new Error('Requested asset does not match monthly budget token')
  }

  const facilitators = accepted.extra?.facilitators
  if (!facilitators?.length) throw new Error('No facilitator addresses provided')

  // 4) Redelegate only the amount needed for this call
  const { permissionContext } =
    await sessionAccountWalletClient.redelegatePermissionContext({
      environment,
      permissionContext: granted.context,
      scope: {
        type: ScopeType.Erc20TransferAmount,
        tokenAddress: accepted.asset,
        maxAmount: BigInt(accepted.amount),
      },
      caveats: [
        {
          type: CaveatType.Redeemer,
          redeemers: facilitators,
        },
      ],
    })

  // 5) Build x402 payment payload
  const paymentPayload = {
    x402Version: 2,
    accepted,
    payload: {
      delegationManager: granted.delegationManager,
      permissionContext,
      delegator: granted.from,
    },
  }

  const encodedPayment = Buffer.from(JSON.stringify(paymentPayload)).toString('base64')

  // 6) Make paid request
  const res = await fetch('https://api.example.com/api/pro', {
    headers: {
      'PAYMENT-SIGNATURE': encodedPayment,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || 'Paid request failed')
  }

  return res.json()
}
```

## Seller side

- MetaMask’s server example uses `@x402/express`, `paymentMiddleware`, and `x402ExactEvmErc7710ServerScheme` from `@metamask/x402` to protect an endpoint and settle through the MetaMask facilitator. [docs.airblock](https://docs.airblock.ai/javascript_sdk/default_wallet_events/)
- The docs show installing `@metamask/x402 @x402/core @x402/express cors express` and configuring a route like `GET /api/hello` with `assetTransferMethod: 'erc7710'`. [docs.airblock](https://docs.airblock.ai/javascript_sdk/default_wallet_events/)

```ts
// server.ts
import express from 'express'
import cors from 'cors'
import { paymentMiddleware, x402ResourceServer } from '@x402/express'
import { x402ExactEvmErc7710ServerScheme } from '@metamask/x402'
import { HTTPFacilitatorClient } from '@x402/core/server'

const app = express()
const NETWORK_ID = 'eip155:8453' // Base mainnet in MetaMask docs table
const payToAddress = '0xYOUR_TREASURY_WALLET'

const facilitatorClient = new HTTPFacilitatorClient({
  url: 'https://tx-sentinel-base-mainnet.dev-api.cx.metamask.io/platform/v2/x402',
})

app.use(cors({ exposedHeaders: ['PAYMENT-REQUIRED', 'PAYMENT-RESPONSE'] }))

app.use(
  paymentMiddleware(
    {
      'GET /api/pro': {
        accepts: [
          {
            scheme: 'exact',
            price: '$5.00',
            network: NETWORK_ID,
            payTo: payToAddress,
            extra: {
              assetTransferMethod: 'erc7710',
            },
          },
        ],
        description: 'Monthly subscription API endpoint',
        mimeType: 'application/json',
      },
    },
    new x402ResourceServer(facilitatorClient).register(
      NETWORK_ID,
      new x402ExactEvmErc7710ServerScheme()
    )
  )
)

app.get('/api/pro', (_req, res) => {
  res.json({ ok: true, plan: 'pro' })
})

app.listen(4402, () => {
  console.log('Server listening on :4402')
})
```

## Install

```bash
npm install viem @metamask/smart-accounts-kit @metamask/x402 @x402/core @x402/express express cors
```

- Use the buyer code in your frontend or trusted client flow, and the seller code in your API server. MetaMask’s docs show Base and Base Sepolia facilitator endpoints, plus the `PAYMENT-REQUIRED` / `PAYMENT-SIGNATURE` header flow. [projectai](https://projectai.in/projects/48ca0dea-f93c-417c-adbb-42e0e67c41c6/tasks/ce6b83df-b874-47c6-8681-6044e57fa057)

## Notes

- This does **not** blindly auto-charge forever; it auto-pays only within the user-approved periodic budget and permission expiry. Once the period cap is hit or permission expires, you need a fresh approval. [projectai](https://projectai.in/projects/48ca0dea-f93c-417c-adbb-42e0e67c41c6/tasks/ce6b83df-b874-47c6-8681-6044e57fa057)
- If you want, I can turn this into a **Next.js API route + React hook** example with TypeScript types.