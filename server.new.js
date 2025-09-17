import express from 'express';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = 3002;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Lista endpointów, które nie wymagają Supabase
const nonSupabaseEndpoints = [
  'tts.js',
  'health.js',
  'agent.js',
  'gpt.js',
  'whisper.js',
  'places.js'
];

// Load API routes dynamically
const apiDir = path.join(__dirname, 'api');
const apiFiles = fs.readdirSync(apiDir).filter(file => file.endsWith('.js'));

// Lista załadowanych endpointów
const loadedEndpoints = [];

for (const file of apiFiles) {
  try {
    // Sprawdź, czy endpoint wymaga Supabase
    const requiresSupabase = !nonSupabaseEndpoints.includes(file);
    const supabaseUrl = process.env.SUPABASE_URL;
    
    // Jeśli endpoint wymaga Supabase, ale brak konfiguracji, pomiń go
    if (requiresSupabase && !supabaseUrl) {
      console.log(`Skipping ${file}: Supabase configuration required`);
      continue;
    }

    const route = `/api/${path.parse(file).name}`;
    const module = await import(`./api/${file}`);
    
    if (module.default) {
      app.use(route, module.default);
      loadedEndpoints.push(route);
      console.log(`Loaded API route: ${route}`);
    }
  } catch (error) {
    console.error(`Failed to load API route ${file}:`, error.message);
  }
}

// Default route
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    endpoints: loadedEndpoints
  });
});

server.listen(3002, '127.0.0.1', (error) => {
  if (error) {
    console.error('Error starting server:', error);
    return;
  }
  console.log(`Backend server running on http://127.0.0.1:3002`);
  console.log('Available endpoints:');
  loadedEndpoints.forEach(endpoint => console.log(`  - ${endpoint}`));
});