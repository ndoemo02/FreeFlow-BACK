// /api/tts.js
// Google Cloud Text-to-Speech endpoint with caching
import fetch from 'node-fetch';
import { generateCacheKey, getCachedAudio, cacheAudio } from '../lib/tts-cache.js';

export default async function handler(req, res) {
  // CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice_id = 'pl-PL-Wavenet-D', voice_settings = {} } = req.body || {};
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Missing "text"' });
    }

    if (!process.env.GOOGLE_TTS_API_KEY) {
      return res.status(500).json({ error: 'Missing GOOGLE_TTS_API_KEY' });
    }

    // Sprawdź cache
    const cacheKey = generateCacheKey(text, voice_id, voice_settings);
    const cachedAudio = await getCachedAudio(cacheKey);
    
    if (cachedAudio) {
      console.log('Cache hit:', cacheKey);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('X-Cache', 'HIT');
      return res.send(cachedAudio);
    }

    console.log('Cache miss:', cacheKey);

    // Google Cloud TTS
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: 'pl-PL',
          name: voice_id
        },
        audioConfig: {
          audioEncoding: 'MP3',
          effectsProfileId: ['large-home-entertainment-class-device'],
          speakingRate: voice_settings.speed || 1.0,
          pitch: voice_settings.pitch || 0,
          volumeGainDb: voice_settings.volume || 0
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google TTS error: ${errorText}`);
    }

    const data = await response.json();
    const audioContent = Buffer.from(data.audioContent, 'base64');

    // Cache the audio data
    try {
      await cacheAudio(cacheKey, audioContent);
      console.log('Cached:', cacheKey);
    } catch (cacheError) {
      console.warn('Cache write error:', cacheError);
      // Continue even if caching fails
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).send(audioContent);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
