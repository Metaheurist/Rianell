import http from 'http';
import handler from 'serve-handler';

/**
 * @param {string} root - directory to serve
 * @returns {Promise<{ port: number, close: () => Promise<void> }>}
 */
export async function startStaticServer(root) {
  const server = http.createServer((req, res) =>
    handler(req, res, { public: root, cleanUrls: false })
  );

  const port = await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') resolve(addr.port);
      else reject(new Error('No port'));
    });
    server.on('error', reject);
  });

  return {
    port,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
