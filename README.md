# Affiliate Engine

Affiliate marketing SaaS – AI-powered market scan, trend analysis, domain suggestions, content generation.

## Quick Start

1. Clone and install: `git clone ... && npm run install:all`
2. Configure: `cp backend/.env.example backend/.env` – add your OPENAI_API_KEY
3. Migrate DB: `npm run migrate`
4. (Optional) Seed demo data: `npm run seed`
5. Start: `npm run dev`

## Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health check**: http://localhost:3000/api/healthz

## Hybrid Mode

| Condition | Behavior |
|-----------|----------|
| OPENAI_API_KEY set + internet | Real AI responses |
| MOCK_MODE=true | Always use mock JSON |
| No internet / no API key | Automatic fallback to mock data in ≤3s |

## 100% Offline Test

Disconnect wifi → refresh app → all pages still work (mock data)

## API Key Setup (backend/.env)

```
OPENAI_API_KEY=sk-...           # Required for AI features
WORDPRESS_URL=https://site.com  # Optional: WordPress publishing
WORDPRESS_USER=admin            # Optional
WORDPRESS_APP_PASSWORD=xxx      # Optional (WP Application Password)
```

## Technology Stack

- **Backend**: Node.js 20+, TypeScript, Express 5, better-sqlite3, OpenAI SDK v4
- **Frontend**: React 19, TypeScript, Vite 5, Tailwind CSS v4, shadcn/ui, wouter
- **Database**: SQLite (better-sqlite3)
- **Ports**: Backend 3000, Frontend 5173

## Architecture

- Fully local development – no cloud dependencies
- Hybrid mode with automatic fallback to mock data
- Server-Sent Events (SSE) for real-time streaming
- JSON field serialization in SQLite
- Single-user application (no authentication)
- Czech UI language
- Dark theme with purple accents

## Features

- **Deep Scan**: 4-phase wizard for market analysis
  - Phase 1: Market selection
  - Phase 2: Trend discovery
  - Phase 3: Deep trend analysis
  - Phase 4: Domain suggestions

- **Domain Portfolio**: CRUD operations for tracked domains
- **Content Generation**: AI-powered site setup and content creation
- **WordPress Integration**: One-click publishing
- **Pipeline Agent**: Automated affiliate factory workflow
- **Configuration**: Model selection, geo filters, trend weights
- **Integrations**: 15 pre-configured services (WordPress, Namecheap, etc.)

## Project Structure

```
affiliate-engine/
├── backend/
│   ├── src/
│   │   ├── app.ts
│   │   ├── index.ts
│   │   ├── lib/logger.ts
│   │   ├── db/index.ts
│   │   └── routes/
│   │       ├── index.ts
│   │       ├── health.ts
│   │       ├── scan.ts
│   │       ├── integrations.ts
│   │       ├── pipeline.ts
│   │       └── wordpress.ts
│   ├── scripts/
│   │   ├── migrate.ts
│   │   └── seed.ts
│   ├── mocks/
│   │   ├── trends.json
│   │   ├── domains.json
│   │   ├── content.json
│   │   └── compliance.json
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── lib/
│   │   ├── hooks/
│   │   ├── components/
│   │   └── pages/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
├── package.json
└── README.md
```

## Environment Variables

### Backend (.env)

```
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
JWT_SECRET=change_me_in_production
DATABASE_URL=./db/app.sqlite
MOCK_MODE=false
OPENAI_API_KEY=sk-...
WORDPRESS_URL=
WORDPRESS_USER=
WORDPRESS_APP_PASSWORD=
MAKE_WEBHOOK_URL=
NAMECHEAP_API_KEY=
NAMECHEAP_USERNAME=
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=
```

## Development

```bash
# Install all dependencies
npm run install:all

# Start development servers (concurrent)
npm run dev

# Migrate database
npm run migrate

# Seed demo data
npm run seed

# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

## License

MIT
