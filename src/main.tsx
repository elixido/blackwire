import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppStateProvider } from './state/AppState';
import { App } from './app/App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppStateProvider>
      <App />
    </AppStateProvider>
  </React.StrictMode>
);
