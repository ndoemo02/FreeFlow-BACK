import { applyCors } from './_utils/cors';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  try {
    const r = await fetch('https://httpbin.org/get', { headers: { 'User-Agent': 'DrWeb/1.0' } });
    const ok = r.ok;
    const data = ok ? await r.json() : null;
    res.status(ok ? 200 : 502).json({ ok, upstreamStatus: r.status, sample: data?.headers || null });
  } catch (e) {
    res.status(502).json({ ok: false, error: e.message });
  }
}
