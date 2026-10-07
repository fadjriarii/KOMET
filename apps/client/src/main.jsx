import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isRetryableError } from './services/apiClient';
import './index.css';
import App from './App.jsx';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // Satu tempat pencatatan kegagalan query; komponen tidak lagi menelan error diam-diam.
    onError: (error, query) => {
      console.error(`[query:${query.queryKey.join('/')}]`, error.message);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      // 400/401/403 tidak sembuh dengan diulang; retry hanya mengulangi beban server.
      retry: (failureCount, error) => isRetryableError(error) && failureCount < 2,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
