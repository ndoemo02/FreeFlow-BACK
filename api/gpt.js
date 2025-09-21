// freeflow-backend/api/gpt.js
import OpenAI from 'openai';

// --- CORS helper (prosty, bezpieczny do testów) ---
function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ALLOWED_ORIGINS || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true; // handled
  }
  return false;
}

// --- Gemini call (REST) ---
async function callGemini({ prompt, system, model, apiKey }) {
  const usedModel = model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  if (!apiKey) {
    throw new Error('Missing Gemini API key (GEMINI_API_KEY).');
  }

  // System prompt jako oddzielne pole – Gemini v1beta używa system_instruction
  // (jeśli nie działa w Twojej wersji, można spłaszczyć do parts:text)
  const body = {
    contents: [
      { role: 'user', parts: [{ text: prompt }] }
    ],
  };

  if (system) {
    body.system_instruction = { role: 'system', parts: [{ text: system }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(usedModel)}:generateContent?key=${apiKey}`;

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`Gemini HTTP ${r.status}: ${text || r.statusText}`);
  }

  const data = await r.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map(p => p?.text || '').join('')?.trim() ||
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    '';

  return {
    provider: 'gemini',
    model: usedModel,
    reply: text,
    raw: data,
  };
}

// --- OpenAI call (SDK) ---
async function callOpenAI({ prompt, system, model, apiKey }) {
  const usedModel = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  if (!apiKey) {
    throw new Error('Missing OpenAI API key (OPENAI_API_KEY).');
  }

  const client = new OpenAI({ apiKey });

  const r = await client.chat.completions.create({
    model: usedModel,
    messages: [
      { role: 'system', content: system || 'You are a helpful assistant.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
  });

  const reply =
    r?.choices?.[0]?.message?.content?.trim?.() ||
    r?.choices?.[0]?.message?.content ||
    '';

  return {
    provider: 'openai',
    model: usedModel,
    reply,
    raw: r,
    usage: r?.usage,
  };
}

// --- Handler główny ---
export default async function handler(req, res) {
  try {
    if (applyCors(req, res)) return;

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, system, model, provider } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    // provider: 'openai' | 'gemini' | undefined
    const chosen = (provider || process.env.LLM_PROVIDER || 'openai').toLowerCase();

    // Najpierw spróbuj wybranego, ewentualnie fallback do drugiego
    let result;
    if (chosen === 'gemini') {
      try {
        result = await callGemini({
          prompt,
          system,
          model,
          apiKey: process.env.GEMINI_API_KEY,
        });
      } catch (e) {
        // fallback do OpenAI
        result = await callOpenAI({
          prompt,
          system,
          model,
          apiKey: process.env.OPENAI_API_KEY,
        });
        result.fallback = 'gemini->openai';
      }
    } else {
      // openai default
      try {
        result = await callOpenAI({
          prompt,
          system,
          model,
          apiKey: process.env.OPENAI_API_KEY,
        });
      } catch (e) {
        // fallback do Gemini
        result = await callGemini({
          prompt,
          system,
          model,
          apiKey: process.env.GEMINI_API_KEY,
        });
        result.fallback = 'openai->gemini';
      }
    }

    return res.status(200).json({
      ok: true,
      provider: result.provider,
      model: result.model,
      reply: result.reply,
      fallback: result.fallback || null,
    });
  } catch (error) {
    console.error('[GPT] error:', error);
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Internal server error',
    });
  }
}
