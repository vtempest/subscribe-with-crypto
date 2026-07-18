Yes — here’s a minimal **monthly recurring payment** example using MetaMask Smart Accounts Kit + x402. The MetaMask flow is: create a Viem wallet client, extend it with `erc7715ProviderActions()`, request an `erc20-token-periodic` permission, then use that permission to pay an x402-protected endpoint automatically within the allowed budget. [docs.metamask](https://docs.metamask.io/smart-accounts-kit/0.13.0/reference/erc7715/wallet-client/)

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