# Zembro

AI-powered lead discovery.

Zembro is a modern data intelligence platform built for teams and entrepreneurs that need accurate, real-time business information. Powered by autonomous AI crawlers, Zembro continuously scans the public web, extracts verified contact and company data, enriches it with smart classification, and makes it instantly searchable.

## Tech stack (backend)

- Node.js + TypeScript
- Postgres (planned)
- Job workers for crawling & enrichment (planned)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Project Structure

```
zembro/
  src/
    index.ts       # Application entry point
    config.ts      # Environment configuration
    logger.ts      # Logging utility
  dist/            # Compiled JavaScript (generated)
  .env             # Environment variables (local)
  .env.example     # Environment template
```

## Roadmap

- ✅ Project skeleton
- 🔄 Database setup (Postgres)
- 🔄 HTTP API (Express/Fastify)
- 🔄 Job workers for crawling
- 🔄 AI enrichment pipeline
