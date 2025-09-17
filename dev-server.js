// dev-server.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';


// --- wybór pliku ENV: .env.local preferowany ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envLocal = path.join(__dirname, '.env.local');
const envDefault = path.join(__dirname, '.env');
const envPath = fs.existsSync(envLocal) ? envLocal : envDefault;

// załaduj ENV (raz!)
dotenv.config({ path: envPath });

// --- maskKey (helper do logów) ---
const maskKey = (v, visible = 4) =>
  !v ? 'MISSING' : `${String(v).slice(0, visible)}... (${String(v).length} chars)`;

// logi ENV
if (process.env.NODE_ENV !== 'production') {
  console.log('[env] GOOGLE_MAPS_API_KEY:', maskKey(process.env.GOOGLE_MAPS_API_KEY));
  console.log('[env] OPENAI_API_KEY    :', maskKey(process.env.OPENAI_API_KEY));
  console.log('[env] SUPABASE_URL      :', process.env.SUPABASE_URL ? 'SET' : 'MISSING');
  console.log('[env] SERVICE_ROLE     :', maskKey(process.env.SUPABASE_SERVICE_ROLE_KEY));

}

// --- APP ---
const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// helper: bezpieczne try/catch
const wrap = (h) => async (req, res) => {
  try { await h(req, res); }
  catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e?.message || e) });
  }
};

// --- ROUTES ---
const places = (await import('./api/places.js')).default;
const agent  = (await import('./api/agent.js')).default;
const auth   = (await import('./api/auth.js')).default;
const dbping = (await import('./api/dbping.js')).default;
const tts    = (await import('./api/tts.js')).default;
const whisper = (await import('./api/whisper.js')).default;
const orderRouting = (await import('./api/order-routing.js')).default;
const businessPanel = (await import('./api/business-panel.js')).default;
const businessRegister = (await import('./api/business-register.js')).default;
const businessCategories = (await import('./api/business-categories.js')).default;
const gpt = (await import('./api/gpt.js')).default;

app.use('/api/places', wrap(places));
app.all('/api/agent',  wrap(agent));
app.use('/api/auth',   wrap(auth));
app.use('/api/dbping', wrap(dbping));
app.all('/api/tts',    wrap(tts));
app.all('/api/whisper', wrap(whisper));
app.all('/api/order-routing', wrap(orderRouting));
app.all('/api/business-panel', wrap(businessPanel));
app.all('/api/business-register', wrap(businessRegister));
app.all('/api/business-categories', wrap(businessCategories));
app.all('/api/gpt', wrap(gpt));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    env: {
      gmaps:  !!process.env.GOOGLE_MAPS_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
    },
    ts: new Date().toISOString(),
  });
});

// START
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Backend działa na http://localhost:${PORT}`));
