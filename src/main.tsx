import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Non-blocking in-memory asset preloading for 0ms transition latency
const CRITICAL_ASSETS = [
  '/map.png',
  '/postech.png',
  '/kaist.png',
  '/gist.png',
  '/dgist.png',
  '/unist.png',
  '/kentech.png',
];

if (typeof window !== 'undefined') {
  CRITICAL_ASSETS.forEach((src) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
