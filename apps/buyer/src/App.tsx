import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { useEffect, useState } from 'react'
import { useSubscriptionStore } from './store'
import { LoadingOverlay } from '@crypto-subscribe/ui'
import CheckoutPage from './pages/checkout-page/CheckoutPage'

const theme = createTheme({
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: 'none', paddingTop: 2, paddingBottom: 2, paddingLeft: 10, paddingRight: 10 },
      },
    },
  },
})

const App = () => {
  const setDetails = useSubscriptionStore((s) => s.setDetails)
  const refreshTick = useSubscriptionStore((s) => s.refreshTick)
  const [loading, setLoading] = useState(true)

  const authToken = new URLSearchParams(window.location.search)
    .get('authToken')
    ?.replace(/~/g, '.')

  useEffect(() => {
    if (!authToken) { setLoading(false); return }
    localStorage.setItem('JWT', authToken)

    const apiUrl = import.meta.env.VITE_API_URL ?? ''
    setLoading(true)
    fetch(`${apiUrl}/api/subscription`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((r) => r.json())
      .then((data) => { setDetails(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [authToken, refreshTick])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LoadingOverlay isLoading={loading} />
      {!loading && authToken && <CheckoutPage />}
      {!authToken && <div style={{ padding: 32 }}>Missing auth token.</div>}
    </ThemeProvider>
  )
}

export default App
