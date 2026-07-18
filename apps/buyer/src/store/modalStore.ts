import { create } from 'zustand'

export enum ECheckoutModal {
  GRANT_BUDGET,
  CANCEL_PLAN,
  ADD_ALLOWANCE,
  UPDATE_BILLING,
}

interface ModalStore {
  modal: ECheckoutModal | undefined
  setModal: (modal: ECheckoutModal | undefined) => void
}

export const useModalStore = create<ModalStore>((set) => ({
  modal: undefined,
  setModal: (modal) => set({ modal }),
}))
