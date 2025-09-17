# FreeFlow Backend API

Voice-to-order system backend API built with Node.js and Express.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- npm or yarn
- Google Maps API key
- OpenAI API key (optional)
- Supabase account (optional)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd freeflow-backend
npm install
```

2. **Configure environment:**
```bash
cp env.example .env
# Edit .env with your actual API keys
```

3. **Start development server:**
```bash
npm run dev-local
```

4. **Start production server:**
```bash
npm run dev
```

## 📡 API Endpoints

### Health Check
```http
GET /api/health
```

### Places Search
```http
GET /api/places?query=pizza&n=3&language=pl
```

### AI Agent
```http
POST /api/agent
Content-Type: application/json

{
  "text": "Chcę zamówić pizzę margherita"
}
```

### Text-to-Speech
```http
POST /api/tts
Content-Type: application/json

{
  "text": "Twoje zamówienie zostało przyjęte"
}
```

### GPT Completion
```http
POST /api/gpt
Content-Type: application/json

{
  "prompt": "Napisz krótki opis pizzy margherita"
}
```

## 🧪 Testing

### HTTP Smoke Tests
```bash
npm run test:http
```

### Manual Testing
Visit `http://localhost:3002` for API tester UI.

### Individual Tests
```bash
# Health check
curl http://localhost:3002/api/health

# Places search
curl "http://localhost:3002/api/places?query=pizza&n=2&language=pl"

# Agent test
curl -X POST http://localhost:3002/api/agent \
  -H "Content-Type: application/json" \
  -d '{"text":"ping"}'
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start production server
- `npm run dev-local` - Start development server
- `npm run start` - Start server (alias for dev)
- `npm run lint` - Run linting
- `npm run test:http` - Run HTTP smoke tests
- `npm run ci` - Run full CI pipeline

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | No |
| `SUPABASE_URL` | Supabase project URL | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | No |
| `FEATURE_UI` | Enable/disable UI | No |
| `PORT` | Server port | No (default: 3002) |

## 📚 Documentation

- [OpenAPI Specification](docs/openapi.yaml)
- [n8n Workflows](docs/n8n-flows.md)
- [HTTP Tests](tests/http/)

## 🔄 CI/CD

### GitHub Actions
- **CI Pipeline:** Runs on push/PR to main/develop
- **Secret Scan:** Detects potential API key leaks
- **Security Scan:** Trivy vulnerability scanning

### n8n Workflows
- **Nightly API Smoke Test:** Automated health checks at 3 AM
- **Key Watch:** Real-time secret detection on commits

## 🏗️ Architecture

```
freeflow-backend/
├── api/                 # API route handlers
├── docs/               # Documentation
├── scripts/            # Utility scripts
├── tests/              # Test files
├── .github/            # GitHub Actions
├── server.js           # Main server file
├── dev-server.js       # Development server
└── package.json        # Dependencies and scripts
```

## 🚀 Deployment

### Vercel
```bash
vercel --prod
```

### Docker
```bash
docker build -t freeflow-backend .
docker run -p 3002:3002 freeflow-backend
```

### Environment Setup
1. Set all required environment variables
2. Ensure API keys are valid
3. Test endpoints before deployment
4. Monitor logs for errors

## 🔍 Monitoring

### Health Checks
- Basic health endpoint for load balancers
- Detailed status with environment info
- Response time monitoring

### Logging
- Request/response logging
- Error tracking
- Performance metrics

### Alerts
- API downtime notifications
- Secret detection alerts
- Performance degradation warnings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run ci`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues:** GitHub Issues
- **Documentation:** [docs/](docs/)
- **API Reference:** [OpenAPI Spec](docs/openapi.yaml)
- **Test UI:** `http://localhost:3002/index-tester.html`