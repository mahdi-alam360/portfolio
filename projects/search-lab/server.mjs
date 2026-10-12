import http from 'node:http';
import { Readable } from 'node:stream';
import { handleSearch } from './shared/handler.mjs';
export function createServer() {
  return http.createServer(async (req, res) => {
    if (req.url !== '/api/search') { res.writeHead(404); res.end('Not found'); return; }
    try {
      const request = new Request('http://localhost/api/search', { method: req.method, headers: req.headers, ...(req.method !== 'GET' && req.method !== 'HEAD' ? { body: Readable.toWeb(req), duplex: 'half' } : {}) });
      const response = await handleSearch(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
    } catch { res.writeHead(500); res.end('Internal server error'); }
  });
}
if (process.argv[1]?.endsWith('server.mjs')) createServer().listen(3001, '127.0.0.1', () => console.log('Search API: http://127.0.0.1:3001/api/search'));
