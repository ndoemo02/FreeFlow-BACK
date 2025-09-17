import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

// CORS
fastify.register(import('@fastify/cors'), {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

// Statyczne pliki cache
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'cache'),
  prefix: '/cache/',
  decorateReply: false
});

// TTS endpoint schema
const ttsSchema = {
  body: {
    type: 'object',
    required: ['text'],
    properties: {
      text: { type: 'string', minLength: 1 },
      voice_id: { type: 'string', default: 'pl-PL-Wavenet-D' },
      voice_settings: {
        type: 'object',
        properties: {
          speed: { type: 'number', default: 1.0 },
          pitch: { type: 'number', default: 0 },
          volume: { type: 'number', default: 0 }
        },
        default: {}
      }
    }
  }
};

// TTS endpoint
fastify.post('/api/tts', { schema: ttsSchema }, async (request, reply) => {
  const { text, voice_id, voice_settings } = request.body;

  try {
    // Cache check
    const cacheKey = generateCacheKey(text, voice_id, voice_settings);
    const cachedAudio = await getCachedAudio(cacheKey);
    
    if (cachedAudio) {
      request.log.info({ cacheKey }, 'Cache hit');
      reply.header('Content-Type', 'audio/mpeg');
      reply.header('X-Cache', 'HIT');
      return cachedAudio;
    }

    request.log.info({ cacheKey }, 'Cache miss');

    // Google TTS API call
    const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GOOGLE_TTS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: voice_id.split('-')[0],
          name: voice_id,
          ...voice_settings
        },
        audioConfig: {
          audioEncoding: "MP3",
          pitch: voice_settings.pitch || 0,
          speakingRate: voice_settings.speed || 1.0,
          volumeGainDb: voice_settings.volume || 0
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google TTS API error: ${errorText}`);
    }

    const { audioContent } = await response.json();
    const audioBuffer = Buffer.from(audioContent, 'base64');

    // Cache the audio
    try {
      await cacheAudio(cacheKey, audioBuffer);
      request.log.info({ cacheKey }, 'Cached successfully');
    } catch (cacheError) {
      request.log.warn({ cacheKey, error: cacheError }, 'Cache write error');
    }

    reply.header('Content-Type', 'audio/mpeg');
    reply.header('X-Cache', 'MISS');
    return audioBuffer;
  } catch (error) {
    request.log.error(error);
    throw error;
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: 'localhost' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();