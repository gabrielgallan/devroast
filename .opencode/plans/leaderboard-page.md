# Leaderboard Page Implementation Plan

## Design Analysis (from Pencil — Screen "5iseT")

The design is a full-width (1440px) dark page with vertical layout:

### 1. Navbar
Already handled by root layout (`<Navbar />`). No action needed.

### 2. Hero Section
- **Title row:** `>` (accent-green, 32px, bold) + `shame_leaderboard` (text-primary, 28px, bold) — gap-3
- **Subtitle:** `// the most roasted code on the internet` — font-secondary, 14px, text-secondary
- **Stats row:** `2,847 submissions · avg score: 4.2/10` — font-secondary, 12px, text-tertiary, gap-2

### 3. Leaderboard Entries (5 entries, gap-5)
Each entry is a bordered card (`border border-border-primary`) with:

#### Meta Row (h-12, flex, justify-between, px-5, border-b)
- **Left side:** `#N` (# tertiary, N amber bold 13px) + `score: X.X` (label tertiary 12px, value red bold 13px) — gap-4
- **Right side:** `language` (secondary 12px) + `N lines` (tertiary 12px) — gap-3

#### Code Block (h-30, overflow-hidden, bg-bg-input)
- **Line numbers column:** w-10, bg-bg-surface, border-r, vertical, items-end, pt-3.5 px-2.5, gap-1.5, text-xs text-tertiary
- **Code content:** Shiki syntax highlighting via `CodeBlock.Content` from existing component

## Data (matching design exactly)

| # | Score | Language   | Lines | Code |
|---|-------|------------|-------|------|
| 1 | 1.2   | javascript | 3     | `eval(prompt("enter code"))` / `document.write(response)` / `// trust the user lol` |
| 2 | 1.8   | typescript | 3     | `if (x == true) { return true; }` / `else if (x == false) { return false; }` / `else { return !false; }` |
| 3 | 2.1   | sql        | 2     | `SELECT * FROM users WHERE 1=1` / `-- TODO: add authentication` |
| 4 | 2.3   | java       | 3     | `catch (e) {` / `  // ignore` / `}` |
| 5 | 2.5   | javascript | 3     | `const sleep = (ms) =>` / `  new Date(Date.now() + ms)` / `  while(new Date() < end) {}` |

## Components Reused

| Component | Usage |
|-----------|-------|
| `CodeBlock.Content` | Shiki server-side syntax highlighting for each entry's code snippet |
| `Navbar` | Already in root layout |

No new components need to be created. The entry layout lives in the page file.

## Design Tokens Used

- Backgrounds: `bg-bg-page`, `bg-bg-input`, `bg-bg-surface`
- Text: `text-text-primary`, `text-text-secondary`, `text-text-tertiary`
- Accents: `text-accent-green`, `text-accent-amber`, `text-accent-red`
- Borders: `border-border-primary`
- Fonts: `font-mono`, `font-secondary`

## File to Create

### `src/app/leaderboard/page.tsx`

Server component (no `"use client"` needed). Uses `export default function LeaderboardPage()`.

Structure:
```
<main className="flex flex-col items-center px-20 pt-10 pb-10">
  <section heroSection>          // w-full max-w-320 flex-col gap-4
    <div titleRow />             // flex items-center gap-3
    <p subtitle />
    <div statsRow />             // flex items-center gap-2
  </section>

  <section entries>              // mt-10 w-full max-w-320 flex-col gap-5
    {entries.map(entry =>
      <article>                  // border border-border-primary
        <div metaRow />          // h-12 flex justify-between px-5 border-b
        <div codeBlock>          // flex h-30 overflow-hidden bg-bg-input
          <div lineNumbers />    // w-10 bg-surface border-r
          <CodeBlock.Content />  // flex-1 shiki highlighting
        </div>
      </article>
    )}
  </section>
</main>
```

## Implementation Steps

1. Create `src/app/leaderboard/` directory
2. Create `page.tsx` with the complete implementation
3. Run `pnpm build` to verify no errors
4. Run `pnpm check` for Biome linting

## Key Decisions

- **Inline layout (no LeaderboardEntry component):** The entry pattern is page-specific. Using `CodeBlock.Content` for syntax highlighting keeps it simple.
- **Normalized score label:** All entries use `score: X.X` format consistently.
- **Server component:** No client-side state needed — pure data rendering with async Shiki highlighting.
