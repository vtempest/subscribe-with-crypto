import express from 'express'
import cors from 'cors'
import { paymentMiddleware, x402ResourceServer } from '@x402/express'
import { x402ExactEvmErc7710ServerScheme } from '@metamask/x402'
import { HTTPFacilitatorClient } from '@x402/core/server'

const app = express()
const PORT = Number(process.env.PORT ?? 4402)
const NETWORK_ID = 'eip155:8453' // Base mainnet
const PAY_TO = process.env.TREASURY_ADDRESS ?? '0xYOUR_TREASURY_WALLET'

// MetaMask facilitator — settles ERC-7710 delegated payments on Base
const facilitator = new HTTPFacilitatorClient({
  url: 'https://tx-sentinel-base-mainnet.dev-api.cx.metamask.io/platform/v2/x402',
})

const resourceServer = new x402ResourceServer(facilitator).register(
  NETWORK_ID,
  new x402ExactEvmErc7710ServerScheme(),
)

app.use(cors({ exposedHeaders: ['PAYMENT-REQUIRED', 'PAYMENT-RESPONSE'] }))
app.use(express.json())

// ── x402 payment middleware ───────────────────────────────────────────────────
app.use(
  paymentMiddleware(
    {
      'GET /api/pro': {
        accepts: [
          {
            scheme: 'exact',
            price: '$5.00',
            network: NETWORK_ID,
            payTo: PAY_TO,
            extra: { assetTransferMethod: 'erc7710' },
          },
        ],
        description: 'Monthly subscription API endpoint',
        mimeType: 'application/json',
      },
    },
    resourceServer,
  ),
)

// ── Protected route ───────────────────────────────────────────────────────────
app.get('/api/pro', (_req, res) => {
  res.json({ ok: true, plan: 'pro' })
})

// ── Subscription details (read by buyer App.tsx on load) ─────────────────────
app.get('/api/subscription', (_req, res) => {
  // TODO: validate Bearer JWT, look up vendor+client in DB, return SubscriptionDetails
  res.json({
    status: 'inactive',
    plan: 'Pro',
    amount: 5000000, // 5.00 USDC (6 decimals)
    token: 'USDC',
    tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    vendorContract: '',
    returnUrl: null,
    webhookUrl: null,
    vendor: 'Demo Vendor',
    nextDate: null,
    paymentMethod: null,
    billingInfo: null,
    invoices: [],
  })
})

// ── Cancel subscription ───────────────────────────────────────────────────────
app.post('/api/subscription/cancel', (_req, res) => {
  // TODO: validate JWT, update DB record, fire SUBSCRIPTION_CANCELLED webhook
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`Seller server listening on :${PORT}`)
})
