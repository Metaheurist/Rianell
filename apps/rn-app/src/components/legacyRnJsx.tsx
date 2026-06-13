/**
 * React 19 strict JSX typing rejects a few legacy RN class components (RefreshControl,
 * FlatList, KeyboardAvoidingView). Thin typed wrappers keep call sites unchanged.
 */
import React from 'react';
import {
  RefreshControl as RNRefreshControl,
  FlatList as RNFlatList,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  type RefreshControlProps,
  type FlatListProps,
  type KeyboardAvoidingViewProps,
} from 'react-native';

type LegacyComponent<P> = React.ComponentType<P>;

export const RefreshControl = RNRefreshControl as unknown as LegacyComponent<RefreshControlProps>;

export function FlatList<ItemT>(props: FlatListProps<ItemT>) {
  const Component = RNFlatList as unknown as LegacyComponent<FlatListProps<ItemT>>;
  return <Component {...props} />;
}

export const KeyboardAvoidingView =
  RNKeyboardAvoidingView as unknown as LegacyComponent<KeyboardAvoidingViewProps>;
