import { useModalStore, ECheckoutModal } from '../../../store'
import { CustomModal } from '@crypto-subscribe/ui'
import { lazy, Suspense } from 'react'
import type { FC } from 'react'

const GrantBudgetModal = lazy(() => import('./GrantBudgetModal'))
const CancelPlanModal = lazy(() => import('./CancelPlanModal'))

const ModalsContainer: FC = () => {
  const modal = useModalStore((s) => s.modal)
  const setModal = useModalStore((s) => s.setModal)

  return (
    <CustomModal open={modal !== undefined} onClose={() => setModal(undefined)} disableCloseOnBackdrop>
      <Suspense fallback={null}>
        {modal === ECheckoutModal.GRANT_BUDGET && <GrantBudgetModal />}
        {modal === ECheckoutModal.CANCEL_PLAN && <CancelPlanModal />}
      </Suspense>
    </CustomModal>
  )
}

export default ModalsContainer
