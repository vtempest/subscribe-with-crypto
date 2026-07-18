import { useSubscriptionStore, useModalStore, ECheckoutModal } from '../../../store'
import { Typography, Divider, Box, Button } from '@mui/material'
import { DisplayField } from '@crypto-subscribe/ui'
import type { FC } from 'react'

const BillingInfo: FC = () => {
  const details = useSubscriptionStore((s) => s.details)
  const setModal = useModalStore((s) => s.setModal)
  const bi = details?.billingInfo

  if (details?.status === 'inactive') return null

  return (
    <>
      <Typography component="h1" variant="h5" sx={{ mt: 3 }}>
        Billing Info
      </Typography>
      <Divider />
      <Box sx={{ mt: 1 }}>
        {bi ? (
          <>
            <DisplayField label="Name" text={bi.name} />
            <DisplayField label="Email" text={bi.email} />
            <DisplayField label="Address" text={bi.address} />
          </>
        ) : (
          <Box sx={{ color: 'text.secondary', mb: 2 }}>No billing info on file</Box>
        )}
        <Button variant="outlined" onClick={() => setModal(ECheckoutModal.UPDATE_BILLING)}>
          Update Billing Info
        </Button>
      </Box>
    </>
  )
}

export default BillingInfo
