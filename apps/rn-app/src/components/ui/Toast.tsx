import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastItem = { id: number; message: string; type: ToastType };

type ToastContextValue = {
  show: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string, type: ToastType = 'success') => {
    idRef.current += 1;
    const id = idRef.current;
    void Haptics.notificationAsync(
      type === 'error' ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Success
    );
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" style={[styles.stack, { top: insets.top + 8 }]}>
        {toasts.map((t) => (
          <Pressable key={t.id} onPress={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}>
            <Animated.View
              style={[
                styles.toast,
                {
                  backgroundColor: theme.color.background === '#070807' ? '#16181aee' : '#ffffffee',
                  borderLeftColor: typeColor(theme, t.type) || theme.color.accent,
                },
              ]}
            >
              <Text style={{ color: theme.color.text }}>{t.message}</Text>
            </Animated.View>
          </Pressable>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function typeColor(theme: ReturnType<typeof useTheme>, type?: ToastType) {
  if (type === 'error') return theme.color.danger || '#f44336';
  if (type === 'warning') return theme.color.warning || '#ff9800';
  if (type === 'info') return theme.color.info || '#2196f3';
  return theme.color.success || theme.color.accent;
}

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
