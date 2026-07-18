import { useSubscriptionStore, useModalStore } from '../../../store'
import { CustomButton } from '@crypto-subscribe/ui'
import { Step, StepLabel, Stepper, Typography, Box, Button, TextField, Grid } from '@mui/material'
import type { FC } from 'react'
import { useState } from 'react'
import { useGrantBudget } from '../../../hooks/useGrantBudget'
import { formatDate, shortenAddress } from '@crypto-subscribe/lib'

const STEPS = ['Connect Wallet', 'Grant Monthly Budget', 'Confirm Subscription']

const GrantBudgetModal: FC = () => {
  const details = useSubscriptionStore((s) => s.details)
  const triggerRefresh = useSubscriptionStore((s) => s.triggerRefresh)
  const setModal = useModalStore((s) => s.setModal)

  const { step, error, address, grantBudget, callPaidEndpoint } = useGrantBudget()

  const usdcAmount = details ? (details.amount / 1e6).toFixed(2) : '0.00'
  const apiUrl = `${import.meta.env.VITE_API_URL ?? ''}/api/pro`

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [billingAddress, setBillingAddress] = useState('')
  const [fieldError, setFieldError] = useState('')

  const activeStep =
    step === 'idle' || step === 'connecting' || step === 'granting' ? 0
    : step === 'granted' ? 1
    : 2

  if (step === 'done') {
    return (
      <>
        <Typography variant="h6" sx={{ mb: 2 }}>Subscription started!</Typography>
        <Typography>
          Your {usdcAmount} USDC/month budget has been granted and the first payment was processed.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button onClick={() => { triggerRefresh(); setModal(undefined) }}>Close</Button>
        </Box>
      </>
    )
  }

  return (
    <>
      <Typography variant="h6" component="h2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <span>{details?.status === 'active' ? 'Change Payment Method' : 'Start Plan'}</span>
        {address && <span style={{ fontSize: '0.875rem' }}>{shortenAddress(address)}</span>}
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mt: 1, mb: 2 }}>
        {STEPS.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Typography>
          Connect your MetaMask wallet. MetaMask will ask you to approve a recurring USDC
          budget of {usdcAmount} USDC/month via ERC-7715. You can revoke this at any time.
        </Typography>
      )}

      {activeStep === 1 && (
        <>
          <Typography sx={{ mb: 2 }}>
            Budget granted! Enter your billing details to confirm. First payment of {usdcAmount}{' '}
            USDC will be charged
            {details?.status === 'cancelled' ? ` from ${formatDate(details.nextDate)}` : ' now'}.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label="Name" fullWidth value={name}
                onChange={(e) => { setName(e.target.value); setFieldError('') }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Email" fullWidth value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldError('') }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Billing Address" fullWidth value={billingAddress}
                onChange={(e) => { setBillingAddress(e.target.value); setFieldError('') }} />
            </Grid>
            {fieldError && (
              <Grid item xs={12}>
                <Typography color="error" variant="body2">{fieldError}</Typography>
              </Grid>
            )}
          </Grid>
        </>
      )}

      {error && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{error}</Typography>}

      <Box sx={{ mt: 3 }}>
        {activeStep === 0 && (
          <CustomButton
            text="Connect & Grant Budget"
            loading={step === 'connecting' || step === 'granting'}
            onClick={() => grantBudget(usdcAmount)}
          />
        )}
        {activeStep === 1 && (
          <CustomButton
            text="Confirm Subscription"
            loading={step === 'paying'}
            onClick={async () => {
              if (!name || !email || !billingAddress) {
                setFieldError('All fields are required')
                return
              }
              await callPaidEndpoint(apiUrl)
            }}
          />
        )}
      </Box>
    </>
  )
}

export default GrantBudgetModal
