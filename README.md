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

## Project Structure

```
affiliate-engine/
├── backend/              # Express 5 API server (TypeScript)
│   ├── src/
│   ├── db/
│   ├── scripts/
│   ├── mocks/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/             # React + Vite SPA (TypeScript)
│   ├── src/
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
└── package.json
```

## Tech Stack

- **Backend**: Node.js 20+, TypeScript, Express 5, better-sqlite3, OpenAI SDK v4, pino logger
- **Frontend**: React 19, TypeScript, Vite 5, Tailwind CSS v4, shadcn/ui, wouter router, @tanstack/react-query v5
- **Database**: SQLite via better-sqlite3
- **Ports**: Backend 3000, Frontend 5173
