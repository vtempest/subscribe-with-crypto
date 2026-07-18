import {
  erc7715ProviderActions,
  erc7710WalletActions,
} from '@metamask/smart-accounts-kit/actions'
import {
  getSmartAccountsEnvironment,
  ScopeType,
  CaveatType,
} from '@metamask/smart-accounts-kit'
import {
  createWalletClient,
  custom,
  http,
  parseUnits,
  privateKeyToAccount,
} from 'viem'
import { base } from 'viem/chains'
import { useState } from 'react'
import { connectWallet, BASE_USDC_ADDRESS } from '@crypto-subscribe/lib'
import type { X402PaymentOption, X402PaymentPayload } from '@crypto-subscribe/lib'

const chain = base
const environment = getSmartAccountsEnvironment(chain.id)

const SESSION_PK = (import.meta.env.VITE_SESSION_PK ?? '') as `0x${string}`
const sessionAccount = SESSION_PK ? privateKeyToAccount(SESSION_PK) : null

const sessionWalletClient = sessionAccount
  ? createWalletClient({ account: sessionAccount, chain, transport: http() }).extend(
      erc7710WalletActions(),
    )
  : null

export type GrantBudgetStep =
  | 'idle'
  | 'connecting'
  | 'granting'
  | 'granted'
  | 'paying'
  | 'done'
  | 'error'

interface UseGrantBudgetReturn {
  step: GrantBudgetStep
  error: string | undefined
  address: string | undefined
  grantBudget: (usdcAmount: string) => Promise<void>
  callPaidEndpoint: (url: string) => Promise<unknown>
}

export const useGrantBudget = (): UseGrantBudgetReturn => {
  const [step, setStep] = useState<GrantBudgetStep>('idle')
  const [error, setError] = useState<string | undefined>()
  const [address, setAddress] = useState<string | undefined>()
  // biome-ignore lint/suspicious/noExplicitAny: permission object shape varies by SAK version
  const [grantedPermission, setGrantedPermission] = useState<any>(undefined)

  const grantBudget = async (usdcAmount: string) => {
    setError(undefined)
    try {
      setStep('connecting')
      const addr = await connectWallet()
      if (!addr) throw new Error('Wallet connection failed or user rejected')
      setAddress(addr)

      setStep('granting')
      const walletClient = createWalletClient({
        chain,
        transport: custom(window.ethereum!),
      }).extend(erc7715ProviderActions())

      if (!sessionAccount) throw new Error('VITE_SESSION_PK not configured')

      const now = Math.floor(Date.now() / 1000)
      const thirtyDays = 60 * 60 * 24 * 30

      const permissions = await walletClient.requestExecutionPermissions([
        {
          chainId: chain.id,
          expiry: now + thirtyDays,
          to: sessionAccount.address,
          permission: {
            type: 'erc20-token-periodic',
            data: {
              tokenAddress: BASE_USDC_ADDRESS,
              periodAmount: parseUnits(usdcAmount, 6),
              periodDuration: thirtyDays,
              startTime: now,
              justification: 'Monthly subscription payment',
            },
            isAdjustmentAllowed: false,
          },
        },
      ])

      setGrantedPermission(permissions[0])
      setStep('granted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStep('error')
    }
  }

  const callPaidEndpoint = async (url: string): Promise<unknown> => {
    if (!grantedPermission) throw new Error('No permission granted — call grantBudget first')
    if (!sessionWalletClient) throw new Error('VITE_SESSION_PK not configured')

    setError(undefined)
    try {
      setStep('paying')

      const probe = await fetch(url)
      if (probe.status !== 402) throw new Error(`Expected 402, got ${probe.status}`)

      const header = probe.headers.get('PAYMENT-REQUIRED')
      if (!header) throw new Error('Missing PAYMENT-REQUIRED header')

      const paymentRequired = JSON.parse(Buffer.from(header, 'base64').toString('utf-8'))
      const accepted: X402PaymentOption = paymentRequired.accepts?.[0]
      if (!accepted) throw new Error('No accepted payment terms in challenge')

      if (accepted.extra?.assetTransferMethod !== 'erc7710') {
        throw new Error('Server requires erc7710 asset transfer method')
      }

      const facilitators = accepted.extra?.facilitators ?? []
      if (!facilitators.length) throw new Error('No facilitator addresses in challenge')

      const { permissionContext } = await sessionWalletClient.redelegatePermissionContext({
        environment,
        permissionContext: grantedPermission.context,
        scope: {
          type: ScopeType.Erc20TransferAmount,
          tokenAddress: accepted.asset as `0x${string}`,
          maxAmount: BigInt(accepted.amount ?? '0'),
        },
        caveats: [{ type: CaveatType.Redeemer, redeemers: facilitators }],
      })

      const payload: X402PaymentPayload = {
        x402Version: 2,
        accepted,
        payload: {
          delegationManager: grantedPermission.delegationManager,
          permissionContext,
          delegator: grantedPermission.from,
        },
      }

      const encodedPayment = Buffer.from(JSON.stringify(payload)).toString('base64')

      const res = await fetch(url, { headers: { 'PAYMENT-SIGNATURE': encodedPayment } })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || `Paid request failed with status ${res.status}`)
      }

      setStep('done')
      return res.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStep('error')
      throw err
    }
  }

  return { step, error, address, grantBudget, callPaidEndpoint }
}
