# DevRoast — Technical Standards

Global conventions for the DevRoast codebase. For UI component-specific rules see `src/components/ui/AGENTS.md`.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 — App Router, Turbopack |
| Language | TypeScript 5.9, strict mode |
| React | 19 (server components by default) |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss` |
| Linter/Formatter | Biome 2 (tabs, double quotes, semicolons, trailing commas) |
| Package manager | pnpm |
| Design source | Pencil `.pen` file (`devroast.pen` at repo root level) |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css         # @theme design tokens + font imports
│   ├── layout.tsx          # Root layout (Navbar, dark theme)
│   ├── page.tsx            # Homepage
│   └── <route>/page.tsx    # Additional routes
└── components/
    └── ui/                 # All reusable UI components
        └── AGENTS.md       # Component-level coding guidelines
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

Current client components: `Toggle`, `CodeEditor`, `ScoreRing`.

## Key Dependencies

| Package | Purpose |
|---|---|
| `@base-ui-components/react` | Headless UI primitives (Switch used in Toggle) |
| `shiki` | Server-side syntax highlighting (CodeBlock) |
| `recharts` | Charts (ScoreRing radial bar) |

## Biome Configuration

- Indent: **tabs**
- Line width: **80**
- Quotes: **double**
- Semicolons: **always**
- Trailing commas: **always**
- `noDangerouslySetInnerHtml`: **warn** (needed for Shiki HTML output)
- `css.parser.tailwindDirectives`: **true** (required for `@theme`)

Run `pnpm check` to lint + format in one pass.

## Component Showcase

Every UI component must have a visual showcase section on `/components`. See `src/components/ui/AGENTS.md` for the exact structure and rules. This serves as the living style guide.

## Commits & Quality

- Run `pnpm build` before considering work complete — the build must pass with no TypeScript or compilation errors.
- Run `pnpm check` to verify Biome linting/formatting.
- The only expected warnings are the Recharts SSR width/height warning (harmless) and the `dangerouslySetInnerHTML` warning in `code-block.tsx`.
