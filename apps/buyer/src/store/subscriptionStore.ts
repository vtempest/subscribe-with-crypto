import type { SubscriptionDetails } from '@crypto-subscribe/lib'
import { create } from 'zustand'

interface SubscriptionStore {
  details: SubscriptionDetails | undefined
  refreshTick: number
  setDetails: (details: SubscriptionDetails) => void
  triggerRefresh: () => void
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  details: undefined,
  refreshTick: 0,
  setDetails: (details) => set({ details }),
  triggerRefresh: () => set((s) => ({ refreshTick: s.refreshTick + 1 })),
}))
