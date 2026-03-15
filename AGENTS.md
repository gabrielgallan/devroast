# DevRoast — Technical Standards

Global conventions for the DevRoast codebase. Module-specific rules are documented in each directory's own `AGENTS.md`:

- `src/components/ui/AGENTS.md` — UI component coding guidelines
- `src/db/AGENTS.md` — Database schema and migration conventions
- `src/trpc/AGENTS.md` — API layer and data fetching patterns
- `specs/AGENTS.md` — Spec-writing format and rules

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 — App Router, Turbopack |
| Language | TypeScript 5.9, strict mode |
| React | 19 (server components by default) |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss` (no tailwind.config — uses `@theme` in CSS) |
| Database | PostgreSQL 17 (Docker Compose) + Drizzle ORM + postgres.js driver |
| API | tRPC v11 + TanStack React Query v5 |
| Validation | Zod v4 (tRPC input/output) |
| Linter/Formatter | Biome 2 (tabs, double quotes, semicolons, trailing commas) |
| Package manager | pnpm |
| Design source | Pencil `.pen` file (`devroast.pen` at repo root level) |

## Project Structure

```
devroast/
├── specs/                      # Feature specs (spec-first workflow)
│   └── AGENTS.md               # Spec-writing guidelines
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── globals.css         # @theme design tokens + font imports
│   │   ├── layout.tsx          # Root layout (Navbar, TRPCReactProvider, dark theme)
│   │   ├── page.tsx            # Homepage (force-dynamic, tRPC prefetch)
│   │   ├── api/trpc/[trpc]/    # tRPC fetch adapter (GET + POST)
│   │   └── <route>/page.tsx    # Additional routes
│   ├── components/
│   │   └── ui/                 # All reusable UI components
│   │       └── AGENTS.md       # Component-level coding guidelines
│   ├── db/                     # Drizzle ORM (schema, migrations, connection)
│   │   └── AGENTS.md           # Database conventions
│   └── trpc/                   # tRPC routers, client/server helpers
│       └── AGENTS.md           # API layer conventions
├── docker-compose.yml          # PostgreSQL 17 container
├── drizzle.config.ts           # Drizzle Kit migration config
└── biome.json                  # Biome 2 linter/formatter config
```

- **One component per file**, kebab-case filenames (`code-editor.tsx`).
- Pages live in `src/app/` following Next.js App Router conventions.
- No `src/lib/`, `src/utils/`, or `src/hooks/` directories yet — create them as needed.

## Code Style

- **Named exports only** — never `export default` (except Next.js pages which require it).
- **Function declarations** — `function Foo()`, never arrow functions or `const` for components.
- **No `forwardRef`** — React 19 passes refs as props natively.
- **Class merging** — `[...classes].filter(Boolean).join(" ")`, no `clsx`/`cn` utilities.
- **Variants** — `Record<Variant, string>` mapping to Tailwind classes, no ternaries.
- **Imports** — use `@/*` path alias for all `src/` imports.

## Design Tokens

All colors, fonts, and spacing are defined as Tailwind `@theme` variables in `globals.css`. Never hardcode hex values when a token exists.

| Category | Prefix | Example |
|---|---|---|
| Backgrounds | `bg-` | `bg-bg-page`, `bg-bg-surface`, `bg-bg-input` |
| Text | `text-` | `text-text-primary`, `text-text-secondary` |
| Borders | `border-` | `border-border-primary`, `border-border-focus` |
| Accents | `accent-` | `text-accent-green`, `bg-accent-red` |
| Syntax | `syn-` | `text-syn-keyword`, `text-syn-function` |
| Fonts | `font-` | `font-mono` (JetBrains Mono), `font-secondary` (IBM Plex Mono) |

## Server vs Client Components

Default to **server components**. Only add `"use client"` when the component needs:
- `useState`, `useEffect`, or other hooks
- Browser-only APIs
- Event handlers that require client-side state

Current client components: `Toggle`, `CodeEditor`, `ScoreRing`, `StatsBar`.

## Data Fetching

All data flows through **tRPC v11** with TanStack React Query. See `src/trpc/AGENTS.md` for full details. The standard pattern is:

1. **Server component** calls `prefetch(trpc.<router>.<procedure>.queryOptions())` to fetch data on the server without an HTTP round-trip.
2. **Server component** wraps its children in `<HydrateClient>` to dehydrate the prefetched data into the client cache.
3. **Client component** calls `useSuspenseQuery(trpc.<router>.<procedure>.queryOptions())` to consume the hydrated data with no refetch.
4. **Loading state** uses `<Suspense fallback={<Skeleton />}>` around the client component with a matching skeleton component.

Pages that use tRPC prefetch must export `const dynamic = "force-dynamic"` to prevent build-time prerendering (which fails without a DB connection).

## Key Dependencies

| Package | Purpose |
|---|---|
| `drizzle-orm` / `postgres` | Type-safe ORM + PostgreSQL driver |
| `@trpc/server` / `@trpc/client` | tRPC v11 core |
| `@trpc/tanstack-react-query` | tRPC + TanStack React Query integration |
| `@tanstack/react-query` | Query cache, mutations, hydration |
| `zod` | Input/output validation for tRPC procedures |
| `@uiw/react-codemirror` | CodeMirror 6 React wrapper (CodeEditor) |
| `highlight.js` | Auto language detection for pasted code |
| `@number-flow/react` | Animated number transitions (StatsBar) |
| `@base-ui-components/react` | Headless UI primitives (Switch in Toggle) |
| `shiki` | Server-side syntax highlighting (CodeBlock) |
| `recharts` | Charts (ScoreRing radial bar) |
| `server-only` / `client-only` | Import guards for server/client boundary |

## Biome Configuration

- Indent: **tabs**
- Line width: **80**
- Quotes: **double**
- Semicolons: **always**
- Trailing commas: **always**
- `noDangerouslySetInnerHtml`: **warn** (needed for Shiki HTML output)
- `css.parser.tailwindDirectives`: **true** (required for `@theme`)

Run `pnpm check` to lint + format in one pass.

## Spec-First Workflow

Every feature must have a spec in `specs/` **before** implementation begins. See `specs/AGENTS.md` for the format. Specs are written in Portuguese. Update the status to `Implemented` and fill in the `Files Modified` section after completion.

## Component Showcase

Every UI component must have a visual showcase section on `/components`. See `src/components/ui/AGENTS.md` for the exact structure and rules. This serves as the living style guide.

## Development Setup

```bash
# Start PostgreSQL
docker compose up -d

# Install dependencies
pnpm install

# Run migrations
pnpm db:migrate

# Start dev server
pnpm dev
```

See `src/db/AGENTS.md` for database workflow details.

## Commits & Quality

- Run `pnpm build` before considering work complete — the build must pass with no TypeScript or compilation errors.
- Run `pnpm check` to verify Biome linting/formatting.
- Expected warnings (harmless):
  - Recharts SSR width/height warning in `score-ring.tsx`
  - `dangerouslySetInnerHTML` warning in `code-block.tsx` (needed for Shiki)
  - `noExplicitAny` warnings in `src/trpc/server.tsx` (required by tRPC prefetch generic)
