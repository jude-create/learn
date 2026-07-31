# Prisma And Supabase Ownership

Prisma is the server-side ORM for trusted application code. It must never be imported into Client Components.

## Environment

Use Supabase PostgreSQL connection strings:

```env
DATABASE_URL=
DIRECT_URL=
```

`DATABASE_URL` should use the pooled Supabase connection for runtime queries. `DIRECT_URL` should use the direct connection for migrations.

## Migration Ownership

Going forward:

- Prisma migrations own application tables, relations, indexes, unique constraints and stable enums.
- Supabase SQL migrations own Auth triggers, RLS policies, Storage buckets, Storage policies, database permissions and special security functions.

The current repository already has SQL migrations that created the first application tables and the Phase 1 academic foundation. Treat the current Prisma schema as a baseline mapping of those existing tables. The next database change should be made in Prisma first for application schema, then paired with a small Supabase SQL migration only when RLS, Storage or database functions are needed.

## Setup Commands

```bash
npm install
npm run prisma:generate
npm run prisma:validate
```

When creating the first Prisma-managed migration after this baseline, use a migration name that clearly describes the application change and do not recreate tables already present in Supabase SQL migrations.
