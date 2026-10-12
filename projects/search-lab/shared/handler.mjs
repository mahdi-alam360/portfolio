import { search, LIMITS } from './search.mjs';
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
export async function handleSearch(request) {
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Use POST for search.' }), { status: 405, headers: { 'Content-Type': 'application/json', Allow: 'POST' } });
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json({ error: 'Use application/json.' }, 415);
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Provide a JSON request body.' }, 400);
    let size = 0;
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > LIMITS.bodyBytes) { await reader.cancel(); return json({ error: 'Request is too large (100 KB maximum).' }, 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let input;
    try { input = JSON.parse(new TextDecoder().decode(bytes)); } catch { return json({ error: 'Request body must be valid JSON.' }, 400); }
    try { return json(search(input)); } catch (error) { return json({ error: error.message }, 400); }
  } catch { return json({ error: 'Unable to read the request.' }, 400); }
}
