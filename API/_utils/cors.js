// Minimalny, bezpieczny CORS do funkcji serverless (Vercel)
export function applyCors(req, res) {
  const origin = req.headers.origin || '*'; // możesz wstawić stałą domenę frontu
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // szybka obsługa preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true; // sygnalizuj, że zakończyliśmy odpowiedź
  }
  return false;
}
