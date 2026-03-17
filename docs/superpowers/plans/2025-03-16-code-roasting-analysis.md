# Code Roasting & Analysis Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement OpenAI GPT-4o integration to generate code analysis with roast mode support, including background processing, polling UI, and error handling.

**Architecture:** Fire-and-forget async analysis (submit → immediate redirect → polling) with database transaction consistency. OpenAI GPT-4o generates structured JSON (score, verdict, roastText, issues, diffs). Results page polls via React Query until ready or error occurs.

**Tech Stack:** Next.js 16, tRPC v11, Drizzle ORM, OpenAI GPT-4o SDK, React Query v5, TypeScript, Tailwind CSS

---

## File Structure Overview

### New Files to Create
- `src/lib/openai.ts` — OpenAI client, `generateRoastAnalysis()`, `formatErrorMessage()`
- `src/components/ui/roast-result-skeleton.tsx` — Loading skeleton matching result layout
- `src/components/ui/roast-result-display.tsx` — Client component with polling + error handling
- `docs/superpowers/plans/2025-03-16-code-roasting-analysis.md` — This plan (reference only)

### Files to Modify
- `src/db/schema.ts` — Add `errorMessage` column to `roastResults` table
- `src/trpc/routers/roast.ts` — Implement `scheduleAnalysis()`, update `submit` mutation
- `src/app/roast/[id]/page.tsx` — Server component with prefetch + Suspense
- `package.json` — Add `openai` dependency
- `.env.local` — Add `OPENAI_API_KEY`

### Migration
- Auto-generated in `migrations/` after schema change (handled by Drizzle Kit)

---

## Chunk 1: Dependencies & Environment Setup

### Task 1: Install OpenAI SDK

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add openai package**

Open `package.json` and add `"openai": "^4.70.0"` to `dependencies`:

```json
{
  "dependencies": {
    "openai": "^4.70.0",
    // ... other deps
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `pnpm install`

Expected: Package is installed without conflicts.

- [ ] **Step 3: Verify installation**

Run: `node -e "const OpenAI = require('openai').default; console.log(typeof OpenAI);"`

Expected: `"function"` — SDK is importable.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: add openai sdk"
```

---

### Task 2: Configure OpenAI API Key

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Add OPENAI_API_KEY**

Edit `.env.local` and add (if not exists):

```
OPENAI_API_KEY=sk-... # your actual key here
```

- [ ] **Step 2: Verify env var is readable**

Run: `node -e "console.log(process.env.OPENAI_API_KEY ? 'Set' : 'Not set');"`

Expected: `"Set"`

- [ ] **Step 3: No commit needed**

`.env.local` is in `.gitignore` — never commit secrets.

---

## Chunk 2: OpenAI Integration Library

### Task 3: Create OpenAI Client & Helper Functions

**Files:**
- Create: `src/lib/openai.ts`

- [ ] **Step 1: Write `src/lib/openai.ts`**

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export type RoastAnalysis = {
	score: number;
	verdict: "looks_clean" | "could_be_better" | "needs_serious_help";
	roastText: string;
	issues: Array<{
		severity: "critical" | "warning" | "good";
		title: string;
		description: string;
	}>;
	diffs: Array<{
		type: "added" | "removed" | "context";
		content: string;
	}>;
	model: string;
	promptTokens: number;
	completionTokens: number;
	latencyMs: number;
};

export async function generateRoastAnalysis(
	code: string,
	language: string,
	roastMode: boolean,
): Promise<RoastAnalysis> {
	const startTime = Date.now();

	const tone = roastMode
		? "Provide brutally honest, sarcastic, humorous feedback. Be witty and entertaining while critiquing the code."
		: "Provide professional, constructive feedback. Be helpful and educational.";

	// Score ranges: 0-33 = needs_serious_help, 34-66 = could_be_better, 67-100 = looks_clean
	const prompt = `
You are an expert code reviewer. Analyze the following ${language} code and provide detailed feedback:

\`\`\`${language}
${code}
\`\`\`

${tone}

Return a JSON object with:
- score: integer from 0-100 (0-33 serious problems, 34-66 needs improvement, 67-100 good code)
- verdict: one of "looks_clean", "could_be_better", or "needs_serious_help"
- roastText: string with main commentary (${roastMode ? "sarcastic and humorous" : "professional"} tone)
- issues: array of objects with {severity: "critical"|"warning"|"good", title: string, description: string}
- diffs: array of objects with {type: "added"|"removed"|"context", content: string}

Ensure score aligns with verdict.
`;

	const response = await openai.chat.completions.create({
		model: "gpt-4o",
		messages: [{ role: "user", content: prompt }],
		response_format: { type: "json_object" },
		temperature: roastMode ? 0.8 : 0.5,
	});

	const content = response.choices[0].message.content || "";
	const parsed = JSON.parse(content) as RoastAnalysis;

	return {
		score: parsed.score,
		verdict: parsed.verdict,
		roastText: parsed.roastText,
		issues: parsed.issues,
		diffs: parsed.diffs,
		model: "gpt-4o",
		promptTokens: response.usage?.prompt_tokens || 0,
		completionTokens: response.usage?.completion_tokens || 0,
		latencyMs: Date.now() - startTime,
	};
}

export function formatErrorMessage(error: unknown): string {
	if (error instanceof OpenAI.RateLimitError) {
		return "Rate limited. OpenAI API is experiencing high demand. Please try again in a few minutes.";
	}
	if (error instanceof OpenAI.APIError) {
		if (error.status === 401) {
			return "API authentication failed. Contact support.";
		}
		if (error.status === 503) {
			return "OpenAI service is temporarily unavailable. Please try again later.";
		}
		return `API error (${error.status}): ${error.message}`;
	}
	if (error instanceof SyntaxError) {
		return "Failed to parse API response. This may indicate an unsupported code format.";
	}
	if (error instanceof Error) {
		return `Analysis error: ${error.message}`;
	}
	return "Analysis failed for unknown reasons. Please try again.";
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `pnpm build --no-next-lint`

Expected: No TypeScript errors in `src/lib/openai.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/openai.ts
git commit -m "feat: add openai client and helper functions"
```

---

## Chunk 3: Database Schema Update

### Task 4: Modify Database Schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add errorMessage column to roastResults**

Open `src/db/schema.ts`, find the `roastResults` pgTable definition (around line 75), and add this field before the closing brace:

```typescript
export const roastResults = pgTable(
	"roast_results",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		submissionId: uuid("submission_id")
			.notNull()
			.unique()
			.references(() => submissions.id, { onDelete: "cascade" }),
		score: integer("score").notNull(),
		verdict: verdictEnum("verdict").notNull(),
		roastText: text("roast_text").notNull(),
		model: text("model").notNull(),
		promptTokens: integer("prompt_tokens"),
		completionTokens: integer("completion_tokens"),
		latencyMs: integer("latency_ms"),
		errorMessage: text("error_message"), // NEW: optional, stores API errors
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [index("idx_roast_results_score").on(table.score)],
);
```

- [ ] **Step 2: Generate migration**

Run: `pnpm db:generate`

Expected: A new file appears in `migrations/` (e.g., `migrations/0003_add_error_message.sql`).

- [ ] **Step 3: Review generated migration**

Run: `cat migrations/<latest>.sql | grep -i error_message`

Expected: SQL contains `ADD COLUMN error_message TEXT;`

- [ ] **Step 4: Apply migration to database**

Run: `pnpm db:migrate`

Expected: Migration runs successfully, no errors.

- [ ] **Step 5: Verify TypeScript compilation**

Run: `pnpm build --no-next-lint`

Expected: No TypeScript errors (schema types updated automatically by Drizzle).

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts migrations/
git commit -m "db: add errorMessage column to roast_results"
```

---

## Chunk 4: tRPC Router Implementation

### Task 5: Implement scheduleAnalysis Function in Router

**Files:**
- Modify: `src/trpc/routers/roast.ts`

- [ ] **Step 1: Add imports at top**

Add to the top of `src/trpc/routers/roast.ts`:

```typescript
import { generateRoastAnalysis, formatErrorMessage } from "@/lib/openai";
import { analysisIssues, suggestedDiffs } from "@/db/schema";
```

- [ ] **Step 2: Implement scheduleAnalysis function**

Add this function **before** the `export const roastRouter` line:

```typescript
async function scheduleAnalysis(
	submissionId: string,
	code: string,
	language: string,
	roastMode: boolean,
	db: typeof db, // Pass db instance
): Promise<void> {
	try {
		const analysis = await generateRoastAnalysis(code, language, roastMode);

		// Transação: garantir que todas as inserts succedem ou todas falham
		await db.transaction(async (tx) => {
			const [result] = await tx
				.insert(roastResults)
				.values({
					submissionId,
					score: analysis.score,
					verdict: analysis.verdict,
					roastText: analysis.roastText,
					model: analysis.model,
					promptTokens: analysis.promptTokens,
					completionTokens: analysis.completionTokens,
					latencyMs: analysis.latencyMs,
				})
				.returning({ id: roastResults.id });

			// Salvar issues
			if (analysis.issues.length > 0) {
				await tx.insert(analysisIssues).values(
					analysis.issues.map((issue, index) => ({
						roastResultId: result.id,
						severity: issue.severity,
						title: issue.title,
						description: issue.description,
						sortOrder: index,
					})),
				);
			}

			// Salvar diffs
			if (analysis.diffs.length > 0) {
				await tx.insert(suggestedDiffs).values(
					analysis.diffs.map((diff, index) => ({
						roastResultId: result.id,
						lineType: diff.type,
						content: diff.content,
						sortOrder: index,
					})),
				);
			}
		});
	} catch (error) {
		// Salvar erro para exibição
		const errorMessage = formatErrorMessage(error);
		await db.insert(roastResults).values({
			submissionId,
			score: 0,
			verdict: "needs_serious_help",
			roastText: "Analysis failed",
			errorMessage,
			model: "gpt-4o",
		});
	}
}
```

- [ ] **Step 3: Update submit mutation**

Find the `submit: baseProcedure` in `roastRouter` and replace its implementation:

```typescript
submit: baseProcedure
	.input(
		z.object({
			code: z.string().min(1).max(100_000),
			language: z.enum([
				"javascript",
				"typescript",
				"tsx",
				"python",
				"rust",
				"go",
				"html",
				"css",
				"json",
				"sql",
				"bash",
				"c",
				"cpp",
				"java",
				"ruby",
				"php",
				"swift",
				"kotlin",
				"yaml",
				"markdown",
				"unknown",
			]),
			lineCount: z.number().int().min(1).max(2000),
			roastMode: z.boolean(),
		}),
	)
	.mutation(async ({ ctx, input }) => {
		const [submission] = await ctx.db
			.insert(submissions)
			.values({
				sessionId: crypto.randomUUID(),
				code: input.code,
				language: input.language,
				lineCount: input.lineCount,
				roastMode: input.roastMode,
			})
			.returning({ id: submissions.id });

		// Fire-and-forget: schedule background analysis without awaiting
		void scheduleAnalysis(submission.id, input.code, input.language, input.roastMode, ctx.db)
			.catch((err) => {
				console.error("[scheduleAnalysis] Unhandled error:", err);
				// TODO: log to monitoring service (e.g., Sentry) if available
			});

		return { submissionId: submission.id };
	}),
```

- [ ] **Step 4: Verify TypeScript compilation**

Run: `pnpm build --no-next-lint`

Expected: No TypeScript errors in `src/trpc/routers/roast.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/trpc/routers/roast.ts
git commit -m "feat: implement scheduleAnalysis with background processing"
```

---

## Chunk 5: UI Skeletons & Result Display

### Task 6: Create Result Skeleton Component

**Files:**
- Create: `src/components/ui/roast-result-skeleton.tsx`

- [ ] **Step 1: Write skeleton component**

```typescript
export function RoastResultSkeleton() {
	return (
		<div className="flex flex-col gap-8">
			{/* Score & Verdict Section */}
			<div className="flex flex-col gap-4">
				<div className="h-32 w-32 rounded-full bg-bg-elevated animate-pulse" />
				<div className="h-6 w-48 rounded bg-bg-elevated animate-pulse" />
			</div>

			{/* Roast Text */}
			<div className="space-y-2">
				<div className="h-4 w-full rounded bg-bg-elevated animate-pulse" />
				<div className="h-4 w-5/6 rounded bg-bg-elevated animate-pulse" />
				<div className="h-4 w-4/6 rounded bg-bg-elevated animate-pulse" />
			</div>

			{/* Issues Section */}
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<div key={i} className="space-y-2 border-l-4 border-border-primary pl-4">
						<div className="h-5 w-40 rounded bg-bg-elevated animate-pulse" />
						<div className="h-4 w-full rounded bg-bg-elevated animate-pulse" />
					</div>
				))}
			</div>

			{/* Diff Section */}
			<div className="space-y-2 font-mono text-sm">
				{[1, 2, 3].map((i) => (
					<div key={i} className="h-5 w-full rounded bg-bg-elevated animate-pulse" />
				))}
			</div>
		</div>
	);
}

export { RoastResultSkeleton };
```

- [ ] **Step 2: Verify export**

Run: `pnpm build --no-next-lint`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/roast-result-skeleton.tsx
git commit -m "ui: add roast result skeleton loader"
```

---

### Task 7: Create Result Display Component with Polling

**Files:**
- Create: `src/components/ui/roast-result-display.tsx`

- [ ] **Step 1: Write client component**

```typescript
"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { RoastResultSkeleton } from "./roast-result-skeleton";

interface RoastResultDisplayProps {
	submissionId: string;
}

export function RoastResultDisplay({ submissionId }: RoastResultDisplayProps) {
	const trpc = useTRPC();

	const { data } = useSuspenseQuery({
		...trpc.roast.getById.queryOptions({ id: submissionId }),
		refetchInterval: 2000, // Poll every 2 seconds
		refetchIntervalInBackground: false, // Don't poll when tab is hidden
	});

	// If there's an error, show it
	if (data.errorMessage) {
		return (
			<div className="rounded border border-accent-red bg-accent-red/10 p-6">
				<h2 className="mb-2 font-mono text-lg font-bold text-accent-red">
					Analysis Failed
				</h2>
				<p className="text-text-secondary">{data.errorMessage}</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-8">
			{/* Score & Verdict */}
			<div className="flex items-center gap-8">
				<div className="flex flex-col items-center">
					<div className="text-4xl font-bold text-text-primary">
						{data.score}
					</div>
					<div className="text-sm text-text-secondary">/100</div>
				</div>
				<div className="flex flex-col">
					<div className="font-mono text-sm text-text-secondary">Verdict</div>
					<div className="font-mono font-bold text-text-primary">
						{data.verdict.replace(/_/g, " ")}
					</div>
				</div>
			</div>

			{/* Roast Text */}
			<div className="border-l-4 border-border-primary pl-6">
				<p className="whitespace-pre-wrap text-text-primary">{data.roastText}</p>
			</div>

			{/* Issues */}
			{data.issues.length > 0 && (
				<div className="space-y-4">
					<h3 className="font-mono text-sm font-bold text-text-primary">
						// Issues Found
					</h3>
					<div className="space-y-3">
						{data.issues.map((issue, idx) => (
							<div key={idx} className="border-l-4 border-border-primary pl-4">
								<div className="flex items-center gap-2">
									<span className="inline-block rounded bg-accent-red px-2 py-1 font-mono text-xs font-bold text-accent-red">
										{issue.severity}
									</span>
									<h4 className="font-mono font-bold text-text-primary">
										{issue.title}
									</h4>
								</div>
								<p className="mt-2 text-sm text-text-secondary">
									{issue.description}
								</p>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Diffs */}
			{data.diffs.length > 0 && (
				<div className="space-y-2 font-mono text-xs">
					<h3 className="font-bold text-text-primary">// Suggested Changes</h3>
					<div className="bg-bg-surface p-4">
						{data.diffs.map((diff, idx) => (
							<div
								key={idx}
								className={[
									"py-1",
									diff.type === "added" && "text-accent-green",
									diff.type === "removed" && "text-accent-red",
									diff.type === "context" && "text-text-secondary",
								]
									.filter(Boolean)
									.join(" ")}
							>
								<span className="mr-2">{diff.type === "added" ? "+" : diff.type === "removed" ? "-" : " "}</span>
								{diff.content}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export { RoastResultDisplay };
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `pnpm build --no-next-lint`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/roast-result-display.tsx
git commit -m "ui: add roast result display with polling"
```

---

## Chunk 6: Results Page Implementation

### Task 8: Implement Results Page with Suspense

**Files:**
- Modify: `src/app/roast/[id]/page.tsx`

- [ ] **Step 1: Check current page structure**

Read the file `src/app/roast/[id]/page.tsx` to see what's already there.

- [ ] **Step 2: Write/Update page.tsx**

Replace the contents with:

```typescript
import { Suspense } from "react";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { RoastResultDisplay } from "@/components/ui/roast-result-display";
import { RoastResultSkeleton } from "@/components/ui/roast-result-skeleton";

export const dynamic = "force-dynamic";

interface RoastPageProps {
	params: Promise<{ id: string }>;
}

export default async function RoastPage({ params }: RoastPageProps) {
	const { id } = await params;

	// Prefetch the roast result (may be Pending, so NOT_FOUND is okay)
	try {
		prefetch(trpc.roast.getById.queryOptions({ id }));
	} catch {
		// If result doesn't exist yet, that's fine — client will poll
	}

	return (
		<HydrateClient>
			<main className="flex flex-col items-center px-10 pt-20 pb-10">
				<div className="w-full max-w-195">
					<Suspense fallback={<RoastResultSkeleton />}>
						<RoastResultDisplay submissionId={id} />
					</Suspense>
				</div>
			</main>
		</HydrateClient>
	);
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `pnpm build --no-next-lint`

Expected: No TypeScript errors.

- [ ] **Step 4: Test page structure**

Run dev server: `pnpm dev`

Navigate to (manually submit code first, then):
- `http://localhost:3000/roast/<any-uuid>`

Expected: Page loads, shows skeleton while polling for results.

- [ ] **Step 5: Commit**

```bash
git add src/app/roast/[id]/page.tsx
git commit -m "feat: implement results page with polling and suspense"
```

---

## Chunk 7: Integration & Testing

### Task 9: Full Integration Test

**Files:** (No new files, testing existing code)

- [ ] **Step 1: Build project**

Run: `pnpm build`

Expected: Build succeeds with no TypeScript errors or warnings (aside from known ones in `code-block.tsx` and `score-ring.tsx`).

- [ ] **Step 2: Run linter**

Run: `pnpm check`

Expected: No linting or formatting errors.

- [ ] **Step 3: Start dev server**

Run: `pnpm dev`

Expected: Dev server starts without errors.

- [ ] **Step 4: Manual E2E test — Standard Mode**

1. Navigate to `http://localhost:3000`
2. Paste this code:
   ```javascript
   function add(a, b) {
     return a + b;
   }
   ```
3. Verify "Roast Mode" toggle is **OFF**
4. Click "Analyze" button
5. Redirect to `/roast/[id]` with skeleton
6. Wait 5-10 seconds
7. Results appear with professional tone

Expected: Analysis loads, tone is constructive and professional.

- [ ] **Step 5: Manual E2E test — Roast Mode**

1. Navigate to `http://localhost:3000`
2. Paste the same code
3. Toggle "Roast Mode" **ON**
4. Click "Analyze"
5. Wait for results
6. Verify roastText uses sarcastic tone

Expected: Same structure, but roastText is humorous/sarcastic.

- [ ] **Step 6: Test error handling**

(Simulate by temporarily changing `OPENAI_API_KEY` to invalid value)

1. Edit `.env.local`, change API key to `sk-invalid`
2. Restart dev server
3. Submit code again
4. Wait for results page
5. After ~5 seconds, error message appears

Expected: User-friendly error message displayed, no console crash.

- [ ] **Step 7: Commit final state**

Run: `git status`

Expected: All files committed, clean working tree.

```bash
git log --oneline -5
```

Expected: Recent commits show the tasks above.

---

## Chunk 8: Status Update

### Task 10: Update Spec Status

**Files:**
- Modify: `specs/2025-03-16-code-roasting-analysis.md`

- [ ] **Step 1: Update spec status**

Change the first line from:
```markdown
**Status**: Design (Ready for Implementation)
```

to:
```markdown
**Status**: Implemented
```

- [ ] **Step 2: Add "Files Modified" section**

Add this section after the "Overview":

```markdown
### Files Modified

**New Files:**
- `src/lib/openai.ts` — OpenAI integration
- `src/components/ui/roast-result-skeleton.tsx` — Loading skeleton
- `src/components/ui/roast-result-display.tsx` — Results display with polling

**Modified Files:**
- `src/db/schema.ts` — Added `errorMessage` column to `roastResults`
- `src/trpc/routers/roast.ts` — Implemented `scheduleAnalysis()` + background processing
- `src/app/roast/[id]/page.tsx` — Results page with prefetch + Suspense
- `package.json` — Added `openai` dependency
- `.env.local` — Added `OPENAI_API_KEY`

**Migrations:**
- Generated: `migrations/NNNN_add_error_message.sql`
```

- [ ] **Step 3: Commit**

```bash
git add specs/2025-03-16-code-roasting-analysis.md
git commit -m "docs: mark roasting feature as implemented"
```

---

## Summary

**Total Tasks:** 10  
**Estimated Time:** 2-4 hours (includes testing and debugging)  
**Key Checkpoints:**
- After Task 3: OpenAI client working
- After Task 4: Database migration applied
- After Task 5: tRPC router updated
- After Task 9: Full build passes and manual E2E works

**Success Criteria:**
✅ `pnpm build` passes  
✅ `pnpm check` passes  
✅ Manual E2E test works (standard + roast mode)  
✅ Error handling tested  
✅ All files committed  

---

**Next Steps:** Execute this plan using subagent-driven-development or executing-plans skill. Each task is self-contained and can be checked off as completed.
