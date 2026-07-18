import { Grid } from '@mui/material'
import type { FC } from 'react'
import Sidebar from './sidebar/Sidebar'
import ContentPanel from './content/ContentPanel'
import ModalsContainer from './modals/ModalsContainer'

const CheckoutPage: FC = () => (
  <Grid container component="main" sx={{ minHeight: '100vh' }}>
    <Sidebar />
    <ContentPanel />
    <ModalsContainer />
  </Grid>
)

export default CheckoutPage
