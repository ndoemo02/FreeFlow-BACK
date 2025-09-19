import { applyCors } from './_utils/cors';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  res.status(200).json({
    iso: new Date().toISOString(),
    epochMs: Date.now(),
  });
}
