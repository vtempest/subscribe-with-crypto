import { Paper, Grid } from '@mui/material'
import type { FC } from 'react'
import CurrentPlan from './CurrentPlan'
import PaymentMethod from './PaymentMethod'
import BillingInfo from './BillingInfo'
import InvoiceHistory from './InvoiceHistory'

const ContentPanel: FC = () => (
  <Grid item xs={12} sm={8} md={8} sx={{ ml: { sm: '33.33%' } }}>
    <Paper sx={{ p: 4, minHeight: '100vh' }}>
      <CurrentPlan />
      <PaymentMethod />
      <BillingInfo />
      <InvoiceHistory />
    </Paper>
  </Grid>
)

export default ContentPanel
