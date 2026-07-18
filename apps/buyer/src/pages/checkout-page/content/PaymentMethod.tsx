import { useSubscriptionStore, useModalStore, ECheckoutModal } from '../../../store'
import { TextWithTooltip } from '@crypto-subscribe/ui'
import { CheckCircle, Cancel } from '@mui/icons-material'
import {
  Typography,
  Divider,
  Box,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Table,
} from '@mui/material'
import type { FC } from 'react'

const PaymentMethod: FC = () => {
  const details = useSubscriptionStore((s) => s.details)
  const setModal = useModalStore((s) => s.setModal)
  const pm = details?.paymentMethod

  return (
    <>
      <Typography component="h1" variant="h5" sx={{ mt: 3 }}>
        Payment Method
      </Typography>
      <Divider />
      <Box sx={{ mt: 1 }}>
        {pm?.wallet ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Token</TableCell>
                  <TableCell>Wallet</TableCell>
                  <TableCell>Allowance</TableCell>
                  <TableCell>Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{pm.token} (ERC-20)</TableCell>
                  <TableCell>
                    <TextWithTooltip text={pm.wallet} shortened />
                  </TableCell>
                  <TableCell>
                    {pm.sufficientAllowance ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Cancel color="error" />
                    )}
                  </TableCell>
                  <TableCell>
                    {pm.sufficientBalance ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Cancel color="error" />
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ color: 'text.secondary' }}>No payment method configured</Box>
        )}
        {details?.status !== 'inactive' && (
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={() => setModal(ECheckoutModal.GRANT_BUDGET)}>
              Change Method
            </Button>
            <Button variant="outlined" onClick={() => setModal(ECheckoutModal.ADD_ALLOWANCE)}>
              Add Allowance
            </Button>
          </Box>
        )}
      </Box>
    </>
  )
}

export default PaymentMethod
