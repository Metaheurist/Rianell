import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  children: ReactNode;
  fallbackTitle?: string;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error('ErrorBoundary caught', error, info.componentStack);
    }
  }

  private onRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.wrap} accessibilityRole="alert">
          <Text style={styles.title}>{this.props.fallbackTitle ?? 'Something went wrong'}</Text>
          <Text style={styles.body}>Rianell hit an unexpected error. Your saved data on this device is unchanged.</Text>
          <Pressable style={styles.btn} onPress={this.onRetry} accessibilityRole="button">
            <Text style={styles.btnText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#070807',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e8eeec',
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: 'rgba(232, 238, 236, 0.85)',
    textAlign: 'center',
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#7bdf8c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: {
    color: '#0a0c08',
    fontWeight: '600',
    fontSize: 16,
  },
});
