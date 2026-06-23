export const getRandomBytesAsync = jest.fn(async (size: number) => {
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i += 1) bytes[i] = i % 256;
  return bytes;
});

export const digestStringAsync = jest.fn(() => Promise.resolve('mock-digest'));
