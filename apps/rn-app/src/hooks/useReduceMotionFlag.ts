import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Returns true if motion should be reduced.
 * Sources (OR-combined):
 *  1. OS accessibility "Reduce Motion" setting
 *  2. Rianell in-app reducedMotion user preference
 */
export function useReduceMotionFlag(): boolean {
  const [osReduceMotion, setOsReduceMotion] = useState(false);
  const [appReduceMotion, setAppReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setOsReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => {
      if (mounted) setOsReduceMotion(v);
    });
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  useEffect(() => {
    function handlePrefChange(e: Event) {
      const detail = (e as CustomEvent<{ key: string; value: unknown }>).detail;
      if (detail?.key === 'reducedMotion') {
        setAppReduceMotion(detail.value === true || detail.value === 'true');
      }
    }
    try {
      const globalPrefs = (globalThis as { RianellPrefs?: { get: (k: string) => unknown } }).RianellPrefs;
      if (globalPrefs && typeof globalPrefs.get === 'function') {
        const v = globalPrefs.get('reducedMotion');
        setAppReduceMotion(v === true || v === 'true');
      }
    } catch {
      /* ignore */
    }

    globalThis.addEventListener?.('rianell:prefs:change', handlePrefChange);
    return () => globalThis.removeEventListener?.('rianell:prefs:change', handlePrefChange);
  }, []);

  return osReduceMotion || appReduceMotion;
}
