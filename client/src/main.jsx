import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ApiProvider } from './contexts/ApiContext.jsx';
import { AdminPanelProvider } from './contexts/AdminPanelContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ApiProvider>
        <AdminPanelProvider>
          <App />
        </AdminPanelProvider>
      </ApiProvider>
    </BrowserRouter>
  </React.StrictMode>
);
