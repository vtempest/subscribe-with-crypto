import { useSubscriptionStore } from '../../../store'
import { TagRounded } from '@mui/icons-material'
import { Typography, Divider, Box, IconButton } from '@mui/material'
import { formatDate } from '@crypto-subscribe/lib'
import type { FC } from 'react'

const InvoiceHistory: FC = () => {
  const details = useSubscriptionStore((s) => s.details)
  const { invoices = [] } = details ?? {}

  return (
    <>
      <Typography component="h1" variant="h5" sx={{ mt: 3 }}>
        Invoice History
      </Typography>
      <Divider />
      <Box sx={{ mt: 1 }}>
        {invoices.length === 0 ? (
          <Box sx={{ color: 'text.secondary' }}>No invoices yet</Box>
        ) : (
          invoices.map((inv) => (
            <Box key={inv.hash} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <span>{formatDate(inv.date)}</span>
              <span>
                {(inv.amount / 1e6).toFixed(2)} {inv.token}
              </span>
              <span>{inv.status}</span>
              {inv.hash && (
                <IconButton size="small" component="a" href={inv.hash} target="_blank" rel="noreferrer">
                  <TagRounded fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))
        )}
      </Box>
    </>
  )
}

export default InvoiceHistory
