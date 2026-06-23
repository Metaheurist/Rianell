export class Directory {
  uri: string;

  constructor(...parts: Array<string | Directory>) {
    this.uri = parts
      .map((part) => (part instanceof Directory ? part.uri.replace(/\/$/, '') : String(part).replace(/\/$/, '')))
      .filter(Boolean)
      .join('/');
  }

  create = jest.fn(async () => undefined);
}

export class File {
  uri: string;
  parentDirectory: Directory;
  exists = false;
  size = 0;

  constructor(parent: Directory, ...parts: string[]) {
    this.parentDirectory = parent;
    this.uri = [parent.uri, ...parts].filter(Boolean).join('/');
  }

  delete = jest.fn(() => undefined);

  move = jest.fn((_dest: File) => undefined);

  static downloadFileAsync = jest.fn(async (url: string, dir: Directory) => {
    const name = url.split('/').pop() ?? 'download.bin';
    return new File(dir, name);
  });
}

export const Paths = {
  cache: 'file:///mock-cache',
  document: 'file:///mock-documents',
};

export const getInfoAsync = jest.fn(async () => ({ exists: false, isDirectory: false, size: 0 }));
export const makeDirectoryAsync = jest.fn(async () => undefined);
export const downloadAsync = jest.fn(async (_url: string, localPath: string) => ({
  uri: localPath,
  status: 200,
  headers: {},
  md5: null,
}));
