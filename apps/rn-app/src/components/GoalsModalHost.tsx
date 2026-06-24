import React, { useEffect, useState } from 'react';
import { GoalsModal } from './GoalsModal';
import { AchievementUnlockToast } from './AchievementUnlockToast';
import { registerGoalsModalOpenListener } from '../achievements/goalsModalBridge';
import type { Preferences } from '../storage/preferences';

type Props = {
  prefs: Preferences;
  onChangePrefs: (next: Preferences) => void;
};

export function GoalsModalHost({ prefs, onChangePrefs }: Props) {
  const [visible, setVisible] = useState(false);
  const [pane, setPane] = useState(0);

  useEffect(() => {
    registerGoalsModalOpenListener((p) => {
      setPane(p);
      setVisible(true);
    });
    return () => registerGoalsModalOpenListener(null);
  }, []);

  return (
    <>
      <AchievementUnlockToast />
      <GoalsModal
        visible={visible}
        initialPane={pane}
        prefs={prefs}
        onChangePrefs={onChangePrefs}
        onClose={() => setVisible(false)}
      />
    </>
  );
}
