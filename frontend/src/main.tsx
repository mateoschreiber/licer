import React from 'react';
import ReactDOM from 'react-dom/client';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './shared/auth/AuthProvider';
import { FeedbackHost, notify } from './shared/components/FeedbackHost';
import './styles.css';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: () =>
      notify('Revise su conexión e intente nuevamente.', {
        title: 'No se pudo actualizar la información',
        tone: 'error',
      }),
  }),
  mutationCache: new MutationCache({
    onError: () =>
      notify('La operación no pudo completarse. Revise los datos e intente nuevamente.', {
        title: 'Operación rechazada',
        tone: 'error',
      }),
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <FeedbackHost />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
