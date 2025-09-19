import { applyCors } from './_utils/cors';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  const isJson = (req.headers['content-type'] || '').includes('application/json');
  const body = isJson ? req.body : null;
  res.status(200).json({
    ok: true,
    method: req.method,
    query: req.query,
    headers: req.headers,
    body,
  });
}

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };
