import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

import { FileProvider } from './context/FileContext'; // ✅ new import

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FileProvider> {/* ✅ wrap with FileProvider */}
      <App />
    </FileProvider>
  </React.StrictMode>
);
