import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { LogsScreen } from './LogsScreen';

export function LogsScreenRoute() {
  const [reloadKey, setReloadKey] = useState(0);
  useFocusEffect(
    React.useCallback(() => {
      setReloadKey((x) => x + 1);
    }, [])
  );
  return <LogsScreen reloadKey={reloadKey} />;
}

