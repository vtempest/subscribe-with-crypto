import { CssBaseline, ThemeProvider, Grid } from '@mui/material';
import { useState, useEffect } from 'react';
import CheckoutPage from './pages/checkout-page';
import { createTheme } from '@mui/material/styles';
import { useSubcriptionDetail } from './store';
import { apiGetSubscriptionDetails } from './api/get-subscription-details';
import {
  activeSampleData,
  cancelledSampleData,
  inactiveSampleData,
} from '@core/mock-data';

const IS_DEMO = process.env.REACT_APP_DEMO === 'true';

const defaultTheme = createTheme({
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: 'none',
          paddingTop: '2px',
          paddingBottom: '2px',
          paddingLeft: '10px',
          paddingRight: '10px',
        },
      },
    },
  },
});

const App = () => {
  const details = useSubcriptionDetail((state) => state.details);
  const setDetails = useSubcriptionDetail((state) => state.setDetails);
  const refreshData = useSubcriptionDetail((state) => state.refreshData);

  const searchParams = new URLSearchParams(window.location.search);
  const encodedAuthToken = searchParams.get('authToken');
  const demoStatus = searchParams.get('demo') || 'active';

  const authToken = encodedAuthToken?.replace(/~/g, '.');
  if (!IS_DEMO) localStorage.setItem('JWT', authToken || '');

  const [isLoading, setIsLoading] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <refreshData required to refresh list>
  useEffect(() => {
    if (IS_DEMO) {
      const demoData =
        demoStatus === 'cancelled'
          ? cancelledSampleData
          : demoStatus === 'inactive'
            ? inactiveSampleData
            : activeSampleData;
      setDetails(demoData);
      setIsLoading(false);
      return;
    }

    const getData = async () => {
      setIsLoading(true);
      try {
        const { data } = await apiGetSubscriptionDetails();
        setDetails(data);
        setIsLoading(false);
      } catch (err) {
        console.log(err);
        setIsLoading(false);
      }
    };

    if (authToken) {
      getData();
    }
  }, [refreshData, authToken]);

  const isShowLoader = isLoading || !details || (!IS_DEMO && !authToken);

  return (
    <ThemeProvider theme={defaultTheme}>
      <Grid container component="main" sx={{ height: '100vh' }}>
        <CssBaseline />
        {isShowLoader ? <div>Loading</div> : <CheckoutPage />}
      </Grid>
    </ThemeProvider>
  );
};

export default App;
