# DevRoast

Paste your code. Get roasted.

DevRoast is a code review tool with a twist — instead of polite suggestions, it roasts your code with brutally honest (and optionally sarcastic) feedback. Built with a dark terminal aesthetic that feels like a hacker's playground.

## What It Does

- **Code input** — Paste any code snippet into the editor and submit it for review.
- **Roast mode** — Toggle between brutally honest feedback and full sarcasm mode for maximum entertainment.
- **Scoring** — Every submission gets a score out of 10 based on code quality. Low scores mean your code needs serious help.
- **Shame leaderboard** — The worst code submissions are ranked and displayed publicly so everyone can learn (or laugh).

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — code editor, roast mode toggle, submit button, and a preview of the shame leaderboard |
| `/components` | Living style guide — visual showcase of every UI component with all variants and states |
| `/leaderboard` | Full shame leaderboard (coming soon) |

## Running Locally

```bash
pnpm install
pnpm dev
```

The app runs at `http://localhost:3000` with Turbopack for fast refresh.

## Building

```bash
pnpm build
pnpm start
```

## Linting & Formatting

```bash
pnpm check
```

This runs Biome to lint and format the entire codebase in one pass.
