// Neon Void Cloud Save API - Cloudflare Worker
// Stores player saves in KV, keyed by SHA-256(username:password)

export default {
  async fetch(request, env) {
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // GET /save/:key - Load a player's save
      if (request.method === 'GET' && path.startsWith('/save/')) {
        const key = path.split('/save/')[1];
        if (!key || key.length < 8) {
          return json({ error: 'Invalid key' }, 400, corsHeaders);
        }
        const data = await env.SAVES.get(key, 'json');
        if (!data) {
          return json({ found: false }, 200, corsHeaders);
        }
        return json({ found: true, profile: data }, 200, corsHeaders);
      }

      // PUT /save/:key - Save a player's data
      if (request.method === 'PUT' && path.startsWith('/save/')) {
        const key = path.split('/save/')[1];
        if (!key || key.length < 8) {
          return json({ error: 'Invalid key' }, 400, corsHeaders);
        }
        const body = await request.json();
        // Validate it has expected fields
        if (!body.name || body.coins === undefined) {
          return json({ error: 'Invalid save data' }, 400, corsHeaders);
        }
        // Store in KV (expires after 1 year)
        await env.SAVES.put(key, JSON.stringify(body), { expirationTtl: 31536000 });
        return json({ success: true }, 200, corsHeaders);
      }

      // POST /save/:key - Same as PUT (for compatibility)
      if (request.method === 'POST' && path.startsWith('/save/')) {
        const key = path.split('/save/')[1];
        if (!key || key.length < 8) {
          return json({ error: 'Invalid key' }, 400, corsHeaders);
        }
        const body = await request.json();
        if (!body.name || body.coins === undefined) {
          return json({ error: 'Invalid save data' }, 400, corsHeaders);
        }
        await env.SAVES.put(key, JSON.stringify(body), { expirationTtl: 31536000 });
        return json({ success: true }, 200, corsHeaders);
      }

      // GET /global-msg - Fetch recent global messages
      if (request.method === 'GET' && path === '/global-msg') {
        const data = await env.SAVES.get('_global_messages', 'json');
        return json({ messages: data || [] }, 200, corsHeaders);
      }

      // PUT /global-msg - Post a global message (admin only)
      if (request.method === 'PUT' && path === '/global-msg') {
        const body = await request.json();
        if (!body.from || !body.msg) {
          return json({ error: 'Missing from/msg' }, 400, corsHeaders);
        }
        const ADMINS = ['FEIN', 'VIRAAJ', 'BOBERT12', 'SALIM_SHADY'];
        if (!ADMINS.includes((body.from || '').toUpperCase())) {
          return json({ error: 'Not authorized' }, 403, corsHeaders);
        }
        // Keep last 20 messages
        let messages = await env.SAVES.get('_global_messages', 'json') || [];
        messages.push({ from: body.from, msg: body.msg.substring(0, 200), time: body.time || Date.now() });
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
      return json({ error: e.message }, 500, corsHeaders);
    }
  }
};

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}
