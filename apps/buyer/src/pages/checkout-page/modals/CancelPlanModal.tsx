import { useSubscriptionStore, useModalStore } from '../../../store'
import { Typography, Box, Button } from '@mui/material'
import { CustomButton } from '@crypto-subscribe/ui'
import type { FC } from 'react'
import { useState } from 'react'

const CancelPlanModal: FC = () => {
  const triggerRefresh = useSubscriptionStore((s) => s.triggerRefresh)
  const setModal = useModalStore((s) => s.setModal)
  const [loading, setLoading] = useState(false)
  const apiUrl = import.meta.env.VITE_API_URL ?? ''

  const handleCancel = async () => {
    setLoading(true)
    try {
      await fetch(`${apiUrl}/api/subscription/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('JWT') ?? ''}` },
      })
      triggerRefresh()
      setModal(undefined)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Typography variant="h6" sx={{ mb: 2 }}>Cancel Plan</Typography>
      <Typography>
        Are you sure you want to cancel? Your subscription stays active until the end of the
        current billing period.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={() => setModal(undefined)}>Keep Plan</Button>
        <CustomButton text="Cancel Plan" loading={loading} color="error" onClick={handleCancel} />
      </Box>
    </>
  )
}

export default CancelPlanModal
