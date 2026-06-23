const mockSecureStore = new Map<string, string>();

export function clearMockSecureStoreForTests(): void {
  mockSecureStore.clear();
}

export const getItemAsync = jest.fn((key: string) =>
  Promise.resolve(mockSecureStore.get(key) ?? null),
);

export const setItemAsync = jest.fn((key: string, value: string) => {
  mockSecureStore.set(key, value);
  return Promise.resolve();
});

export const deleteItemAsync = jest.fn((key: string) => {
  mockSecureStore.delete(key);
  return Promise.resolve();
});
