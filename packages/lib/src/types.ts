// ─── Subscription / checkout types (ported from recurring-crypto-payments/packages/core/src/types/) ───

export interface PaymentMethod {
  token: string
  tokenAddress: string
  wallet: string
  sufficientAllowance: boolean
  sufficientBalance: boolean
}

export interface BillingInfo {
  name: string
  address: string
  email: string
}

export interface Invoice {
  date: Date
  amount: number
  token: string
  status: string
  hash: string
  invoice: string
}

/** Full subscription details returned by the server for the checkout page */
export interface SubscriptionDetails {
  vendor: string
  plan: string
  amount: number
  token: string
  vendorContract: string
  tokenAddress: string
  returnUrl: string | null
  webhookUrl: string | null
  status: 'active' | 'inactive' | 'cancelled' | 'ended'
  nextDate: Date | null
  paymentMethod: PaymentMethod | null
  billingInfo: BillingInfo | null
  invoices: Invoice[]
  /** ERC-7715 granted permission context (for x402 flow) */
  permissionContext?: string
  delegationManager?: string
  delegatorAddress?: string
}

// ─── Payment records ───

export interface ScheduledPayment {
  _id: string
  vendorContract: string
  userAddress: string
  amount: number
  tokenAddress: string
  paymentDate: Date
  vendorId: string
  vendorClientId: string
}

export interface CompletedPayment extends ScheduledPayment {
  status: 'paid' | 'failed' | 'cancelled'
  hash: string | null
  remarks: string | null
}

// ─── x402 protocol types ───

export interface X402PaymentRequired {
  accepts: X402PaymentOption[]
  description?: string
  mimeType?: string
}

export interface X402PaymentOption {
  scheme: string
  price?: string
  network?: string
  payTo?: string
  asset?: string
  amount?: string
  extra?: {
    assetTransferMethod?: 'erc7710' | string
    facilitators?: string[]
  }
}

export interface X402PaymentPayload {
  x402Version: number
  accepted: X402PaymentOption
  payload: {
    delegationManager: string
    permissionContext: string
    delegator: string
  }
}
