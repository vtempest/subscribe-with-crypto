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

const IS_DEMO = import.meta.env.VITE_DEMO === 'true'

const App = () => {
  const setDetails = useSubscriptionStore((s) => s.setDetails)
  const refreshTick = useSubscriptionStore((s) => s.refreshTick)
  const [loading, setLoading] = useState(true)

  const authToken = new URLSearchParams(window.location.search)
    .get('authToken')
    ?.replace(/~/g, '.')

  useEffect(() => {
    const effectiveToken = authToken ?? (IS_DEMO ? 'demo' : null)
    if (!effectiveToken) { setLoading(false); return }
    if (!IS_DEMO) localStorage.setItem('JWT', effectiveToken)

    const apiUrl = import.meta.env.VITE_API_URL ?? ''
    setLoading(true)
    fetch(`${apiUrl}/api/subscription`, {
      headers: { Authorization: `Bearer ${effectiveToken}` },
    })
      .then((r) => r.json())
      .then((data) => { setDetails(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [authToken, refreshTick])

  const isReady = !loading && (!!authToken || IS_DEMO)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LoadingOverlay isLoading={loading} />
      {isReady && <CheckoutPage />}
      {!IS_DEMO && !authToken && !loading && <div style={{ padding: 32 }}>Missing auth token.</div>}
    </ThemeProvider>
  )
}

export default App
