# server-template

A production-ready **NestJS monorepo template** with PostgreSQL, Redis, BullMQ, JWT/OAuth authentication, Swagger docs, and a full migration system — scaffolded with Nx and pnpm.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Adding Features](#adding-features)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS v11, Express |
| Language | TypeScript 5.9 |
| Database | PostgreSQL via TypeORM 0.3 |
| Caching / Pub-Sub | Redis (ioredis 5) |
| Job Queue | BullMQ 5 |
| Authentication | Passport.js, JWT, Google OAuth2 |
| API Docs | Swagger / OpenAPI |
| Validation | class-validator, Zod |
| Serialization | class-transformer |
| Build | Webpack, Nx 22, SWC |
| Testing | Jest, Vitest |
| Linting / Formatting | ESLint, Prettier |
| Package Manager | pnpm 10 |
| Monorepo | Nx workspace |

---

## Project Structure

```
server-template/
├── apps/
│   └── server/                     # NestJS application
│       ├── src/
│       │   ├── main.ts             # Bootstrap entry point
│       │   ├── app/
│       │   │   ├── app.module.ts   # Root module
│       │   │   ├── app.controller.ts
│       │   │   ├── app.service.ts
│       │   │   ├── decorators/
│       │   │   │   └── serialize.decorator.ts
│       │   │   └── interceptors/
│       │   │       └── serialize.interceptor.ts
│       │   ├── database/
│       │   │   ├── database.module.ts
│       │   │   ├── datasource/
│       │   │   │   └── app.datasource.ts
│       │   │   ├── entities/
│       │   │   │   └── base.entity.ts   # Abstract UUID + timestamps
│       │   │   ├── migrations/
│       │   │   └── redis/
│       │   │       ├── redis.module.ts
│       │   │       ├── redis.config.ts
│       │   │       └── redis.service.ts
│       │   ├── modules/
│       │   │   ├── modules.module.ts    # Feature modules aggregator
│       │   │   └── queue/
│       │   │       └── queue.module.ts  # BullMQ setup
│       │   └── utils/
│       │       ├── parse-json.util.ts   # Zod-validated JSON parse
│       │       └── stringify-json.util.ts
│       ├── .env.example
│       ├── project.json                 # Nx project config
│       ├── webpack.config.js
│       └── tsconfig.json
├── docker-compose.yml                   # PostgreSQL + Redis Stack
├── nx.json
├── pnpm-workspace.yaml
├── eslint.config.mjs
├── jest.config.ts
├── vitest.workspace.ts
└── tsconfig.base.json
```

---

## Architecture

### Monorepo (Nx + pnpm)

The repository is an [Nx](https://nx.dev) monorepo managed with pnpm workspaces. Currently it contains a single app (`apps/server`) but is structured to support additional apps and shared libraries under `apps/` and `libs/` as the project grows. Nx handles task orchestration, build caching, and dependency graph management.

### Application Bootstrap (`main.ts`)

The server starts with the following sequence:

1. Creates a NestJS application backed by Express
2. Applies **Helmet** for standard HTTP security headers
3. Mounts all routes under the `/v1` global prefix
4. Exposes **Swagger UI** at `/v1/swagger`
5. Registers a global **ValidationPipe** (`whitelist: true`, `transform: true`)
6. Attaches `cookie-parser` and a 10 MB JSON body limit
7. Listens on the configured `SERVER_HOST:SERVER_PORT`

### Module Hierarchy

```
AppModule
├── ConfigModule          — dotenv-backed environment config
├── DatabaseModule        — TypeORM (Postgres) + RedisModule
│   └── RedisModule       — ioredis client + subscriber
│       └── QueueModule   — BullMQ queues backed by Redis
└── ModulesModule         — aggregator for all feature modules
```

Feature modules live in `src/modules/` and are registered through `ModulesModule`. This keeps `AppModule` clean and makes it easy to add, remove, or lazy-load domains.

### Database Layer

**TypeORM** manages the PostgreSQL connection and schema migrations.

- Multi-schema support: `public` and `core` schemas out of the box.
- All entities extend `AbstractBaseEntity`, which provides:
  - `id` — UUID v4 primary key
  - `createdAt` / `updatedAt` — auto-managed timestamps
- Migrations live in `src/database/migrations/` and are run via Nx targets (see [Available Scripts](#available-scripts)).
- An ERD is auto-generated after each successful migration deploy (`scripts/generate-erd.ts`).

### Redis Layer

`RedisModule` exposes a `RedisService` wrapping an `ioredis` client. A separate subscriber connection is provided for pub/sub patterns. Configuration supports TLS, optional authentication, and keyspace notifications (expired-key events enabled by default).

### Job Queue (BullMQ)

`QueueModule` connects BullMQ to the same Redis instance. Add new queues and processors inside `src/modules/queue/` or create dedicated module directories for domain-specific queues.

### Serialization

A `@Serialize(Dto)` decorator + `SerializeInterceptor` pair converts controller responses through `class-transformer`, stripping any properties not declared on the DTO (`excludeExtraneousValues: true`).

### Utilities

`parseJson` and `stringifyJson` in `src/utils/` pair standard JSON operations with Zod schema validation, giving you type-safe, schema-enforced serialization without try/catch noise at call sites.

---

## Getting Started

### Prerequisites

- Node.js 22 (see `.nvmrc`)
- pnpm 10
- Docker (for Postgres + Redis)

### Setup

```bash
# 1. Clone and install
pnpm install

# 2. Start infrastructure (PostgreSQL on :5432, Redis on :6379, Redis UI on :8001)
docker compose up -d

# 3. Copy and fill environment variables
cp apps/server/.env.example apps/server/.env

# 4. Run database migrations
npx nx migration:deploy server

# 5. Start the dev server (hot reload via nodemon)
npx nx start server
```

**To reset infrastructure and clear all data:**

```bash
docker compose down -v && docker compose up -d
```

The `-v` flag removes volumes, clearing all database data and Redis queues.

### Access Points

| Service | URL |
|---|---|
| API base | http://localhost:3000/v1 |
| Health check | http://localhost:3000/v1/health |
| Swagger UI | http://localhost:3000/v1/swagger |
| Redis Insight UI | http://localhost:8001 |

---

## Environment Variables

Copy `apps/server/.env.example` to `apps/server/.env` and fill in the values.

```env
NODE_ENV=development

# Server
SERVER_PORT=3000
SERVER_HOST=127.0.0.1
SERVER_URL=http://localhost:3000

# PostgreSQL
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_NAME=postgres

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
# REDIS_USERNAME=
# REDIS_PASSWORD=
# REDIS_TLS=false
# REDIS_TLS_INSECURE=false
```

---

## Available Scripts

All commands are run through Nx.

```bash
# Development
npx nx start server                  # Start with hot reload

# Build
npx nx build server                  # Production build
npx nx build:development server      # Development build

# Testing
npx nx test server                   # Run Jest tests

# Migrations
npx nx migration:deploy server       # Run pending migrations + generate ERD
npx nx migration:revert server       # Revert the last migration
npx nx migration:generate server     # Auto-generate migration from entity changes
npx nx migration:create server       # Create a blank migration file
npx nx migration:show server         # List migration status
npx nx migration:schema:sync server  # Sync schema without migrations (dev only)
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/health` | Health check — returns `{ status, timestamp }` |

All endpoints follow the `/v1/<resource>` convention and are documented automatically at `/v1/swagger` via Swagger decorators.

---

## Adding Features

1. **Create a feature module** in `src/modules/<feature>/`
2. **Register it** in `src/modules/modules.module.ts`
3. **Add entities** in `src/database/entities/` extending `AbstractBaseEntity`
4. **Generate a migration** with `npx nx migration:generate server`
5. **Document controllers** with `@ApiTags`, `@ApiOperation`, and response DTOs for automatic Swagger coverage
6. **Protect routes** by adding JWT or OAuth guards from `@nestjs/passport`
