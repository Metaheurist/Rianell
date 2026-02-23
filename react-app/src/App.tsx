import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

/**
 * React shell for Health Tracker.
 * Embeds the existing web app (built from the parent repo) at /legacy/
 * so the same codebase runs as web and inside Capacitor Android.
 * On Android APK: checks for a newer version on launch and prompts to update.
 */
const LEGACY_APP_PATH = 'legacy/index.html';

/** Base URL where apk/latest.json and APK files are hosted (e.g. GitHub Pages). */
const UPDATE_CHECK_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as Record<string, unknown>).env?.VITE_UPDATE_BASE as string) ||
  'https://metaheurist.github.io/Health-app/';

interface UpdateInfo {
  version: number;
  file: string;
}

const App: React.FC = () => {
  const [updatePrompt, setUpdatePrompt] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const platform = Capacitor.getPlatform();
    if (platform !== 'android') return;

    let cancelled = false;
    (async () => {
      try {
        const info = await CapApp.getInfo();
        const currentBuild = parseInt(info.build || '0', 10) || 0;
        const base = UPDATE_CHECK_BASE.replace(/\/?$/, '/');
        const res = await fetch(`${base}apk/latest.json`, { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as UpdateInfo;
        if (!data?.version || !data?.file || cancelled) return;
        if (data.version > currentBuild) {
          setUpdatePrompt(data);
        }
      } catch {
        // ignore: no network or invalid response
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismissUpdate = () => setUpdatePrompt(null);
  const openDownload = async () => {
    if (!updatePrompt) return;
    const base = UPDATE_CHECK_BASE.replace(/\/?$/, '/');
    const url = `${base}apk/${updatePrompt.file}`;
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <>
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
      {updatePrompt && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              background: '#1e293b',
              color: '#e2e8f0',
              borderRadius: 12,
              padding: 24,
              maxWidth: 360,
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>Update available</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, opacity: 0.9 }}>
              A new version (build {updatePrompt.version}) is available. Download and install to update.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={dismissUpdate}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: '1px solid #475569',
                  background: 'transparent',
                  color: '#e2e8f0',
                  fontSize: 14,
                }}
              >
                Later
              </button>
              <button
                type="button"
                onClick={openDownload}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#4caf50',
                  color: '#fff',
                  fontSize: 14,
                }}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
