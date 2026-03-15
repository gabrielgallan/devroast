# Database — Schema & Migration Conventions

This module contains the Drizzle ORM schema, database connection, and migration files for DevRoast.

## Stack

| Component | Choice |
|---|---|
| Database engine | PostgreSQL 17 (Alpine) via Docker Compose |
| ORM | Drizzle ORM (`drizzle-orm`) |
| Driver | postgres.js (`postgres`) |
| Migration tool | Drizzle Kit (`drizzle-kit`) |
| Config | `drizzle.config.ts` at repo root |
| Env | `DATABASE_URL` in `.env.local` |

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Creates and exports the singleton `db` Drizzle client using postgres.js driver. Reads `DATABASE_URL` from env. |
| `schema.ts` | All table definitions, enums, and relations. Single file — no splitting by domain yet. |
| `migrations/` | Generated SQL migration files (managed by Drizzle Kit). Never edit manually. |

## Schema Conventions

### Primary Keys

- All tables use `uuid` primary keys with `defaultRandom()` — no auto-increment integers.

### Enums

- Use `pgEnum` for columns with a fixed set of values (e.g., `language`, `verdict`, `issue_severity`, `diff_line_type`).
- Enum values use **snake_case** strings matching the UI labels.

### Timestamps

- Use `timestamp("created_at", { withTimezone: true })` with `.notNull().defaultNow()`.
- Always use `withTimezone: true` — stores as `timestamptz` in PostgreSQL.

### Foreign Keys

- Use `.references(() => parentTable.id, { onDelete: "cascade" })` for child tables.
- Add a `UNIQUE` constraint when the relationship is 1:1 (e.g., `roast_results.submission_id`).

### Ordering

- Tables that need ordered children use a `sort_order` integer column with `default(0)`.

### Indexes

- Add indexes on columns frequently used in `WHERE`, `ORDER BY`, or `JOIN` clauses.
- Use `index("idx_<table>_<column>")` naming convention.

### Relations

- Define all relations in `schema.ts` using Drizzle's `relations()` function.
- Relations enable the Drizzle relational query API (`db.query.<table>.findMany({ with: { ... } })`).

## Current Schema

```
submissions 1──1 roast_results 1──N analysis_issues
                               1──N suggested_diffs
```

| Table | Purpose |
|---|---|
| `submissions` | User-submitted code (anonymous, tracked by `session_id`) |
| `roast_results` | AI-generated analysis: score, verdict, roast text, model metadata |
| `analysis_issues` | Individual issues found in the code (severity + title + description) |
| `suggested_diffs` | Line-by-line diff suggestions (added/removed/context) |

## Migration Workflow

### Generating a new migration

After modifying `schema.ts`:

```bash
pnpm db:generate
```

This creates a new SQL file in `migrations/`. **Review the generated SQL** before applying.

### Applying migrations

```bash
pnpm db:migrate
```

Runs all pending migrations against the database.

### Inspecting the database

```bash
pnpm db:studio
```

Opens Drizzle Studio — a web UI to browse tables and data.

### Full workflow for schema changes

1. Edit `src/db/schema.ts`
2. Run `pnpm db:generate` — generates migration SQL
3. Review the generated `.sql` file in `migrations/`
4. Run `pnpm db:migrate` — applies to the database
5. Run `pnpm build` — verify TypeScript compiles with the new schema

## Querying Conventions

- **In tRPC procedures**: Always access the database via `ctx.db` (injected by the tRPC context). Never import `db` directly in router files.
- **Drizzle query builder**: Use `ctx.db.select()`, `ctx.db.insert()`, `ctx.db.update()`, `ctx.db.delete()` for SQL-like queries.
- **Drizzle relational API**: Use `ctx.db.query.<table>.findMany()` / `.findFirst()` when you need nested relations loaded in one query.
- **Aggregate functions**: Import `count`, `avg`, `sum`, `min`, `max` from `drizzle-orm`.
- **Type safety**: All query results are fully typed from the schema — no manual type definitions needed.

## Docker Setup

The PostgreSQL container is defined in `docker-compose.yml` at the repo root:

```bash
# Start the database
docker compose up -d

# Stop the database (preserves data)
docker compose stop

# Reset all data
docker compose down -v
```

Connection details: `devroast:devroast@localhost:5432/devroast`
