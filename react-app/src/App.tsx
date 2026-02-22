import React from 'react';

/**
 * React shell for Health Tracker.
 * Embeds the existing web app (built from the parent repo) at /legacy/
 * so the same codebase runs as web and inside Capacitor Android.
 */
const LEGACY_APP_PATH = 'legacy/index.html';

const App: React.FC = () => {
  return (
    <iframe
      title="Health Tracker"
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
