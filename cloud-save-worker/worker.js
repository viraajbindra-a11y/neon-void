// Neon Void Cloud Save API - Cloudflare Worker
// Saves are stored in KV keyed by SHA-256(username:password) for password accounts
// or by the uppercase username for password-less accounts. Writes are protected by a
// trust-on-first-write `_authToken`: the first save claims the key, later saves must
// present the same token (or a valid admin secret). This stops a known/guessable key
// from being read-then-overwritten by another player without changing any KV key, so
// existing saves are preserved.

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Parse a JSON body without letting a malformed body throw a 500.
    async function readJson() {
      try { return { body: await request.json() }; }
      catch (e) { return { err: json({ error: 'Invalid JSON' }, 400, corsHeaders) }; }
    }

    try {
      // GET /save/:key - Load a player's save (the private auth token is never returned)
      if (request.method === 'GET' && path.startsWith('/save/')) {
        const key = path.split('/save/')[1];
        if (!key || key.length < 8) {
          return json({ error: 'Invalid key' }, 400, corsHeaders);
        }
        const data = await env.SAVES.get(key, 'json');
        if (!data) {
          return json({ found: false }, 200, corsHeaders);
        }
        if (data && typeof data === 'object') delete data._authToken;
        return json({ found: true, profile: data }, 200, corsHeaders);
      }

      // PUT/POST /save/:key - Save a player's data (trust-on-first-write auth)
      if ((request.method === 'PUT' || request.method === 'POST') && path.startsWith('/save/')) {
        const key = path.split('/save/')[1];
        if (!key || key.length < 8) {
          return json({ error: 'Invalid key' }, 400, corsHeaders);
        }
        const { body, err } = await readJson();
        if (err) return err;
        if (!body || !body.name || body.coins === undefined) {
          return json({ error: 'Invalid save data' }, 400, corsHeaders);
        }

        const existing = await env.SAVES.get(key, 'json');
        const adminOverride = !!env.ADMIN_SECRET && body.adminSecret === env.ADMIN_SECRET;
        const incomingToken = typeof body.authToken === 'string' ? body.authToken : '';

        // If this key is already owned by a token, require a matching token
        // (or a valid admin secret). The first write claims ownership.
        if (existing && existing._authToken && !adminOverride && incomingToken !== existing._authToken) {
          return json({ error: 'Not authorized for this save' }, 403, corsHeaders);
        }

        const record = { ...body };
        delete record.adminSecret; // never persist the admin secret
        // Preserve the first-claimed token; adopt the incoming one on the first write.
        const ownerToken = (existing && existing._authToken) || incomingToken || '';
        if (ownerToken) record._authToken = ownerToken; else delete record._authToken;

        await env.SAVES.put(key, JSON.stringify(record), { expirationTtl: 31536000 });
        return json({ success: true }, 200, corsHeaders);
      }

      // GET /global-msg - Fetch recent global messages
      if (request.method === 'GET' && path === '/global-msg') {
        const data = await env.SAVES.get('_global_messages', 'json');
        return json({ messages: data || [] }, 200, corsHeaders);
      }

      // PUT /global-msg - Post a global message (admin only)
      if (request.method === 'PUT' && path === '/global-msg') {
        const { body, err } = await readJson();
        if (err) return err;
        if (!body || !body.from || !body.msg) {
          return json({ error: 'Missing from/msg' }, 400, corsHeaders);
        }
        const ADMINS = ['FEIN', 'VIRAAJ', 'BOBERT12', 'SALIM_SHADY', 'TOYHUNTER007'];
        // If a server secret is configured, require it (non-spoofable). Otherwise fall
        // back to the legacy username check so nothing breaks until the secret is set.
        if (env.ADMIN_SECRET) {
          if (body.adminSecret !== env.ADMIN_SECRET) {
            return json({ error: 'Not authorized' }, 403, corsHeaders);
          }
        } else if (!ADMINS.includes((body.from || '').toUpperCase())) {
          return json({ error: 'Not authorized' }, 403, corsHeaders);
        }
        // Keep last 20 messages
        let messages = await env.SAVES.get('_global_messages', 'json') || [];
        messages.push({ from: String(body.from).substring(0, 24), msg: String(body.msg).substring(0, 200), time: body.time || Date.now() });
        if (messages.length > 20) messages = messages.slice(-20);
        await env.SAVES.put('_global_messages', JSON.stringify(messages), { expirationTtl: 604800 }); // 7 day TTL
        return json({ success: true }, 200, corsHeaders);
      }

      // Health check
      if (path === '/' || path === '/health') {
        return json({ status: 'ok', service: 'neon-void-saves' }, 200, corsHeaders);
      }

      return json({ error: 'Not found' }, 404, corsHeaders);
    } catch (e) {
      console.error('worker error:', (e && e.stack) || e);
      return json({ error: 'Internal error' }, 500, corsHeaders);
    }
  }
};

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}
