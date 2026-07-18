import { useSubscriptionStore, useModalStore, ECheckoutModal } from '../../../store'
import { Typography, Divider, Box, Button } from '@mui/material'
import { capitalizeFirstLetter, formatDate } from '@crypto-subscribe/lib'
import type { FC } from 'react'

const statusText = (
  status: string,
  active: string,
  inactive: string,
  cancelled: string,
  ended: string,
) => {
  if (status === 'active') return active
  if (status === 'inactive') return inactive
  if (status === 'cancelled') return cancelled
  return ended
}

const CurrentPlan: FC = () => {
  const details = useSubscriptionStore((s) => s.details)
  const setModal = useModalStore((s) => s.setModal)
  const { status = 'inactive', nextDate, amount = 0, plan, token } = details ?? {}

  return (
    <>
      <Typography component="h1" variant="h5">
        Current Plan
      </Typography>
      <Divider />
      <Box sx={{ mt: 1 }}>
        <Box
          sx={{
            backgroundColor: status === 'active' ? '#d7f7c2' : '#e3e8ed',
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '5px',
          }}
        >
          {capitalizeFirstLetter(status)}
        </Box>
        <Box sx={{ mt: 1 }}>{plan}</Box>
        <Box>
          {(amount / 1e6).toFixed(2)} {token} / month
        </Box>
        <Box sx={{ mt: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}>
          {statusText(
            status,
            `Auto-renews on ${formatDate(nextDate)}`,
            '',
            `Cancelled — stops ${formatDate(nextDate)}`,
            `Ended since ${formatDate(nextDate)}`,
          )}
        </Box>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() =>
            setModal(
              status === 'active' ? ECheckoutModal.CANCEL_PLAN : ECheckoutModal.GRANT_BUDGET,
            )
          }
        >
          {statusText(status, 'Cancel', 'Start', 'Renew', 'Renew')} Plan
        </Button>
      </Box>
    </>
  )
}

export default CurrentPlan
