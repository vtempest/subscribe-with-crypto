import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { addVendorDetails } from './slices/vendorDetailsSlice';
import { vendorMockData } from '@core/mock-data';

if (process.env.REACT_APP_DEMO === 'true') {
  store.dispatch(
    addVendorDetails({
      name: vendorMockData.name || '',
      email: vendorMockData.email,
      apiKey: vendorMockData.apiKey,
      plan: vendorMockData.plan || '',
      vendorContract: vendorMockData.vendorContract || '',
      tokenAddress: vendorMockData.tokenAddress || '',
      id: vendorMockData._id,
    }),
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
);
