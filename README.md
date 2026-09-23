# Multi-Tenant Backend

A small TypeScript + PostgreSQL backend that demonstrates one thing properly: keeping data from different tenants separated.

I wanted the example to stay fairly boring on purpose. There is no giant framework around it, no fake billing system and no twenty abstractions for a four-line query. The interesting part is the tenant boundary.

## What it does

- tenants and tenant memberships
- simple roles (`owner`, `admin`, `member`)
- tenant context resolved per request
- membership check before tenant data is exposed
- tenant-scoped project queries
- PostgreSQL schema + seed data
- a couple of tests around tenant isolation
- Docker Compose for local Postgres
- GitHub Actions for build + tests

## Important note about authentication

The demo uses these headers:

```text
x-user-id
x-tenant-id
```

That is **not** meant to be production authentication.

They keep the example focused on multi-tenancy instead of turning the repository into another JWT tutorial. In a real application, the user id should come from a verified session or access token. The tenant still needs to be checked against that authenticated user.

## Request flow

```text
Request
  |
  |  x-user-id + x-tenant-id
  v
Tenant middleware
  |
  |-- Is the user a member of this tenant?
  |       |
  |       +-- no  -> 403
  |       |
  |       +-- yes
  v
request.tenant
  |
  v
Tenant-scoped route
  |
  v
SELECT ... WHERE tenant_id = $1
```

The main rule is simple:

> A tenant id coming from the client is a request, not proof of access.

## Stack

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- `pg`
- Zod
- Node test runner + `tsx`

## Project structure

```text
.
├── src/
│   ├── lib/
│   │   └── db-types.ts
│   ├── middleware/
│   │   └── tenant-context.ts
│   ├── routes/
│   │   ├── members.ts
│   │   └── projects.ts
│   ├── app.ts
│   ├── config.ts
│   ├── db.ts
│   └── server.ts
├── sql/
│   ├── 001_schema.sql
│   └── 002_seed.sql
├── test/
│   └── tenant-isolation.test.ts
├── .github/workflows/ci.yml
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Create your environment file

```bash
cp .env.example .env
```

### 4. Create the schema

```bash
psql postgresql://postgres:postgres@localhost:5432/multitenant \
  -f sql/001_schema.sql
```

Then add the demo data:

```bash
psql postgresql://postgres:postgres@localhost:5432/multitenant \
  -f sql/002_seed.sql
```

### 5. Run the API

```bash
npm run dev
```

The server runs on `http://localhost:3000`.

## Example requests

### Health check

```bash
curl http://localhost:3000/health
```

### List projects for a tenant

```bash
curl http://localhost:3000/api/projects \
  -H "x-user-id: 11111111-1111-4111-8111-111111111111" \
  -H "x-tenant-id: aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
```

### Cross-tenant access

Alice is not a member of the Acme tenant, so this returns `403`:

```bash
curl http://localhost:3000/api/projects \
  -H "x-user-id: 11111111-1111-4111-8111-111111111111" \
  -H "x-tenant-id: bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
```

## Tenant-scoped queries

A route should never do this:

```sql
SELECT *
FROM projects
WHERE id = $1;
```

Instead, keep the tenant boundary in the query:

```sql
SELECT *
FROM projects
WHERE id = $1
  AND tenant_id = $2;
```

The same rule applies to updates and deletes.

## Running tests

```bash
npm test
```

The tests focus on two easy-to-break rules:

1. a user without membership gets `403`
2. project queries receive the tenant id as a SQL parameter

## Build

```bash
npm run build
```

Compiled output goes to `dist/`.

## Things I would add next

- real authentication instead of demo headers
- invitations
- role/permission middleware
- audit logs
- tenant-aware API keys
- pagination
- soft deletion
- per-tenant rate limits

I deliberately left those out for now. A multi-tenant example is more useful when you can actually see where the tenant boundary lives.

## License

MIT
