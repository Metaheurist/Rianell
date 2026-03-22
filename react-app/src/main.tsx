import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App';
import './index.css';

declare global {
  interface Window {
    __rianellCapacitorNative?: boolean;
  }
}

if (Capacitor.isNativePlatform()) {
  window.__rianellCapacitorNative = true;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
