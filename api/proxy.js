import { getVercelOidcToken } from '@vercel/oidc';

const GATEWAY_URL = 'https://italgelybcvmytyubveh.supabase.co/functions/v1/content-engine-gateway';

export default async function handler(req, res) {
  try {
    const token = await getVercelOidcToken();

    if (!token) {
      return res.status(500).json({
        error: 'vercel_oidc_unavailable',
        message: 'Vercel did not provide an OIDC token to this Function.',
      });
    }

    const incoming = new URL(req.url, 'https://content-engine.local');
    const target = new URL(GATEWAY_URL);
    target.search = incoming.search;

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      headers['Content-Type'] = 'application/json';
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
    }

    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
    return res.send(text);
  } catch (error) {
    console.error('content_engine_proxy_error', error);
    return res.status(500).json({
      error: 'content_engine_proxy_error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
