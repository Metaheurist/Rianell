import React from 'react';

/**
 * React shell for Rianell (web / Vite preview only).
 * Embeds the existing web app at /legacy/ in an iframe.
 * Native Android/iOS: entry redirects to legacy/index.html (see main.tsx) — no iframe, no React on device.
 */
const LEGACY_APP_PATH = 'legacy/index.html';

const App: React.FC = () => {
  return (
    <iframe
      title="Rianell"
      src={LEGACY_APP_PATH}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        display: 'block',
      }}
    />
  );
};

export default App;
