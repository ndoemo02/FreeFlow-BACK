import { applyCors } from './_utils/cors';

const VERSION = process.env.APP_VERSION || '0.1.0';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  res.status(200).json({ version: VERSION, commit: process.env.VERCEL_GIT_COMMIT_SHA || null });
}
