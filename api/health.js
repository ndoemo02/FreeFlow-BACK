// /api/health.js
export default async function handler(_req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({
    ok: true,
    env: process.env.NODE_ENV || 'development',
    ts: new Date().toISOString()
  });
}
