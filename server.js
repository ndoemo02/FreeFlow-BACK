// server.js
import express from 'express'
import cors from 'cors'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ESM helpers
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = createServer(app)

// --- CORS (whitelist) ---
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://freeflow-frontend-chi.vercel.app', // twój front na Vercel
]

app.use(cors({
  origin(origin, cb) {
    // pozwól bez origin (np. curl/postman) i whitelistę dla przeglądarki
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
    return cb(new Error('Not allowed by CORS'))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false, // ustaw true TYLKO gdy faktycznie wysyłasz ciasteczka i NIE używasz '*'
}))

// Obsługa preflight (opcjonalnie, cors middleware zwykle wystarcza)
app.options('*', cors())

// --- Body parser ---
app.use(express.json())

// --- Przykładowy endpoint, który wcześniej dawał 404 ---
app.get('/api/places', async (req, res) => {
  // TODO: wstaw własną logikę / pobranie z DB
  res.json([
    { id: 1, name: 'Pizzeria Napoli', city: 'Kraków' },
    { id: 2, name: 'Sushi Bar', city: 'Warszawa' },
  ])
})

// --- Healthcheck (przydatne do testów) ---
app.get('/healthz', (req, res) => res.json({ ok: true }))

// --- Start ---
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})