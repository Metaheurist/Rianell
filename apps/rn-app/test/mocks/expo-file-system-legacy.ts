export const documentDirectory = 'file:///mock-documents/';
export const cacheDirectory = 'file:///mock-cache/';

export const getInfoAsync = jest.fn(async () => ({ exists: false, isDirectory: false, size: 0 }));
export const makeDirectoryAsync = jest.fn(async () => undefined);
export const downloadAsync = jest.fn(async (_url: string, localPath: string) => ({
  uri: localPath,
  status: 200,
  headers: {},
  md5: null,
}));
export const writeAsStringAsync = jest.fn(async () => undefined);
export const readAsStringAsync = jest.fn(async () => '');
export const deleteAsync = jest.fn(async () => undefined);
