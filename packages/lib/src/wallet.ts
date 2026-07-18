import { createWalletClient, createPublicClient, custom, http, parseUnits, type WalletClient } from 'viem'
import { base } from 'viem/chains'

declare global {
  interface Window {
    // biome-ignore lint/suspicious/noExplicitAny: provider typing varies by wallet
    ethereum?: any
  }
}

export const BASE_CHAIN = base
export const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`

export const CHAIN_ID_HEX: Record<string, string> = {
  base: '0x2105',
  'base-sepolia': '0x14a34',
}

export const getBrowserWalletClient = (): WalletClient =>
  createWalletClient({ chain: BASE_CHAIN, transport: custom(window.ethereum!) })

export const getPublicClient = () =>
  createPublicClient({ chain: BASE_CHAIN, transport: http() })

export const requestAccounts = async (): Promise<`0x${string}` | undefined> => {
  try {
    const accounts = (await window.ethereum?.request({ method: 'eth_requestAccounts' })) as `0x${string}`[]
    return accounts?.[0]
  } catch (err) {
    console.error('eth_requestAccounts failed:', err)
    return undefined
  }
}

export const switchToBase = async (): Promise<boolean> => {
  try {
    await window.ethereum?.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_ID_HEX.base }],
    })
    return true
  } catch {
    try {
      await window.ethereum?.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: CHAIN_ID_HEX.base,
            chainName: 'Base',
            rpcUrls: ['https://mainnet.base.org'],
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            blockExplorerUrls: ['https://basescan.org'],
          },
        ],
      })
      return true
    } catch {
      console.error('User rejected chain switch to Base')
      return false
    }
  }
}

export const connectWallet = async (): Promise<`0x${string}` | undefined> => {
  const switched = await switchToBase()
  if (!switched) return undefined
  return requestAccounts()
}

export const formatUsdc = (raw: bigint | number): string => (Number(raw) / 1e6).toFixed(2)

export const parseUsdc = (human: string): bigint => parseUnits(human, 6)
