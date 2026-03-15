import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";
import { db } from "./index";
import {
	analysisIssues,
	roastResults,
	submissions,
	suggestedDiffs,
} from "./schema";

// ── Seed Data ───────────────────────────────────────────────

const seedEntries = [
	{
		submission: {
			code: `eval(prompt("Enter code"));
document.write(result);
alert("done");`,
			language: "javascript" as const,
			lineCount: 3,
			roastMode: true,
		},
		roast: {
			score: 12,
			verdict: "needs_serious_help" as const,
			roastText:
				'"this code is a security incident waiting to happen. eval + prompt + document.write is the unholy trinity of XSS."',
			model: "gpt-4o",
		},
		issues: [
			{
				severity: "critical" as const,
				title: "eval() with user input",
				description:
					"eval() executes arbitrary code. Combined with prompt(), this hands full control of the page to the user — or any attacker who can inject input.",
			},
			{
				severity: "critical" as const,
				title: "document.write after load",
				description:
					"document.write() called after the page loads will wipe the entire DOM. This is a legacy API that should never appear in modern code.",
			},
			{
				severity: "warning" as const,
				title: "no error handling",
				description:
					"If eval throws (and it will), the error crashes silently. There is no try/catch, no validation, no sanitization — nothing.",
			},
		],
		diffs: [
			{
				lineType: "removed" as const,
				content: 'eval(prompt("Enter code"));',
			},
			{
				lineType: "removed" as const,
				content: "document.write(result);",
			},
			{
				lineType: "removed" as const,
				content: 'alert("done");',
			},
			{
				lineType: "added" as const,
				content:
					"// Never use eval() with user input. Use a safe parser instead.",
			},
			{
				lineType: "added" as const,
				content: 'const output = document.getElementById("output");',
			},
			{
				lineType: "added" as const,
				content: "output.textContent = safeResult;",
			},
		],
	},
	{
		submission: {
			code: `if (x == true) { return true; }
else if (x == false) { return false; }
else { return null; }`,
			language: "typescript" as const,
			lineCount: 3,
			roastMode: true,
		},
		roast: {
			score: 18,
			verdict: "needs_serious_help" as const,
			roastText:
				'"congratulations, you wrote 3 lines to accomplish what `return x ?? null` does in one. this is the boolean equivalent of a rube goldberg machine."',
			model: "gpt-4o",
		},
		issues: [
			{
				severity: "critical" as const,
				title: "redundant boolean comparison",
				description:
					"Comparing a value to true/false with == is redundant and error-prone. Just return the value directly, or use strict equality (===) at minimum.",
			},
			{
				severity: "warning" as const,
				title: "loose equality operator",
				description:
					"Using == instead of === allows type coercion. In TypeScript, this defeats the purpose of having a type system.",
			},
			{
				severity: "good" as const,
				title: "handles null case",
				description:
					"At least the else branch accounts for falsy non-boolean values. The intent is there, even if the execution is painful.",
			},
		],
		diffs: [
			{
				lineType: "removed" as const,
				content: "if (x == true) { return true; }",
			},
			{
				lineType: "removed" as const,
				content: "else if (x == false) { return false; }",
			},
			{
				lineType: "removed" as const,
				content: "else { return null; }",
			},
			{
				lineType: "added" as const,
				content: "return x ?? null;",
			},
		],
	},
	{
		submission: {
			code: `SELECT * FROM users WHERE name = '\${input}';
DROP TABLE users;
-- TODO: add authentication`,
			language: "sql" as const,
			lineCount: 3,
			roastMode: true,
		},
		roast: {
			score: 21,
			verdict: "needs_serious_help" as const,
			roastText:
				'"the TODO comment at the end is chilling. you left a SQL injection wide open AND a DROP TABLE in production. this is not code — it\'s a confession."',
			model: "gpt-4o",
		},
		issues: [
			{
				severity: "critical" as const,
				title: "SQL injection vulnerability",
				description:
					"String interpolation in SQL queries allows attackers to inject arbitrary SQL. Always use parameterized queries or prepared statements.",
			},
			{
				severity: "critical" as const,
				title: "destructive DROP TABLE statement",
				description:
					"A DROP TABLE in application code is almost never correct. This would destroy all user data if executed.",
			},
			{
				severity: "warning" as const,
				title: "SELECT * anti-pattern",
				description:
					"SELECT * fetches all columns, including sensitive data you may not need. Always specify the columns you need explicitly.",
			},
			{
				severity: "warning" as const,
				title: "missing authentication TODO",
				description:
					"The comment admits authentication is missing. Shipping code with known security gaps and a TODO is a red flag.",
			},
		],
		diffs: [
			{
				lineType: "removed" as const,
				// biome-ignore lint/suspicious/noTemplateCurlyInString: intentional SQL injection example
				content: "SELECT * FROM users WHERE name = '${input}';",
			},
			{
				lineType: "removed" as const,
				content: "DROP TABLE users;",
			},
			{
				lineType: "removed" as const,
				content: "-- TODO: add authentication",
			},
			{
				lineType: "added" as const,
				content: "SELECT id, name, email FROM users WHERE name = $1;",
			},
			{
				lineType: "context" as const,
				content: "-- Use parameterized queries, never interpolate.",
			},
		],
	},
	{
		submission: {
			code: `def process_items(items, result=[]):
    for item in items:
        try:
            result.append(item.upper())
        except:
            pass
    return result`,
			language: "python" as const,
			lineCount: 7,
			roastMode: false,
		},
		roast: {
			score: 55,
			verdict: "could_be_better" as const,
			roastText:
				'"mutable default argument and bare except — the two classic python footguns in one function. at least the logic itself is straightforward."',
			model: "gpt-4o",
		},
		issues: [
			{
				severity: "critical" as const,
				title: "mutable default argument",
				description:
					"Default mutable arguments (like []) are shared across all calls to the function. Each invocation appends to the SAME list, causing subtle bugs that are notoriously hard to debug.",
			},
			{
				severity: "warning" as const,
				title: "bare except clause",
				description:
					"A bare `except:` catches everything, including KeyboardInterrupt and SystemExit. Always catch specific exceptions like `except AttributeError:`.",
			},
			{
				severity: "good" as const,
				title: "clear function name",
				description:
					"process_items communicates the function's purpose. The parameter names are also clear and descriptive.",
			},
			{
				severity: "good" as const,
				title: "simple iteration pattern",
				description:
					"The for-loop is easy to follow. A list comprehension would be more idiomatic, but this is readable.",
			},
		],
		diffs: [
			{
				lineType: "removed" as const,
				content: "def process_items(items, result=[]):",
			},
			{
				lineType: "added" as const,
				content: "def process_items(items):",
			},
			{
				lineType: "context" as const,
				content: "    # Use None as default, create new list inside",
			},
			{
				lineType: "removed" as const,
				content: "        try:",
			},
			{
				lineType: "removed" as const,
				content: "            result.append(item.upper())",
			},
			{
				lineType: "removed" as const,
				content: "        except:",
			},
			{
				lineType: "removed" as const,
				content: "            pass",
			},
			{
				lineType: "added" as const,
				content:
					"    return [item.upper() for item in items if isinstance(item, str)]",
			},
		],
	},
	{
		submission: {
			code: `func fetchUser(ctx context.Context, id string) (*User, error) {
	if id == "" {
		return nil, fmt.Errorf("user id cannot be empty")
	}

	user, err := db.GetUser(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("fetch user %s: %w", id, err)
	}

	return user, nil
}`,
			language: "go" as const,
			lineCount: 11,
			roastMode: false,
		},
		roast: {
			score: 82,
			verdict: "looks_clean" as const,
			roastText:
				'"honestly, not much to roast here. proper error wrapping, context propagation, input validation. the go gods would be pleased."',
			model: "gpt-4o",
		},
		issues: [
			{
				severity: "good" as const,
				title: "proper error wrapping with %w",
				description:
					"Using fmt.Errorf with %w preserves the error chain, allowing callers to use errors.Is() and errors.As() for inspection.",
			},
			{
				severity: "good" as const,
				title: "context.Context as first param",
				description:
					"Following Go conventions by passing context as the first parameter. This enables cancellation and deadline propagation.",
			},
			{
				severity: "good" as const,
				title: "input validation before DB call",
				description:
					"Checking for empty ID before hitting the database saves an unnecessary round-trip and provides a clear error message.",
			},
			{
				severity: "warning" as const,
				title: "consider using named return values",
				description:
					"Named return values can improve readability in Go, especially for functions with multiple returns. Minor stylistic preference.",
			},
		],
		diffs: [
			{
				lineType: "context" as const,
				content:
					"func fetchUser(ctx context.Context, id string) (*User, error) {",
			},
			{
				lineType: "context" as const,
				content: '	if id == "" {',
			},
			{
				lineType: "removed" as const,
				content: '		return nil, fmt.Errorf("user id cannot be empty")',
			},
			{
				lineType: "added" as const,
				content: '		return nil, errors.New("user id cannot be empty")',
			},
			{
				lineType: "context" as const,
				content: "	}",
			},
			{
				lineType: "context" as const,
				content: "	// rest unchanged",
			},
		],
	},
];

// ── Main ────────────────────────────────────────────────────

async function main() {
	console.log("Seeding database...\n");

	// Truncate all tables (cascade from submissions)
	await db.execute(sql`TRUNCATE TABLE submissions CASCADE`);
	console.log("Truncated all tables.");

	for (const entry of seedEntries) {
		// Insert submission
		const [sub] = await db
			.insert(submissions)
			.values({
				sessionId: faker.string.uuid(),
				code: entry.submission.code,
				language: entry.submission.language,
				lineCount: entry.submission.lineCount,
				roastMode: entry.submission.roastMode,
				createdAt: faker.date.recent({ days: 30 }),
			})
			.returning({ id: submissions.id });

		// Insert roast result
		const [roast] = await db
			.insert(roastResults)
			.values({
				submissionId: sub.id,
				score: entry.roast.score,
				verdict: entry.roast.verdict,
				roastText: entry.roast.roastText,
				model: entry.roast.model,
				promptTokens: faker.number.int({ min: 200, max: 800 }),
				completionTokens: faker.number.int({ min: 100, max: 400 }),
				latencyMs: faker.number.int({ min: 1500, max: 5000 }),
				createdAt: faker.date.recent({ days: 30 }),
			})
			.returning({ id: roastResults.id });

		// Insert analysis issues
		await db.insert(analysisIssues).values(
			entry.issues.map((issue, i) => ({
				roastResultId: roast.id,
				severity: issue.severity,
				title: issue.title,
				description: issue.description,
				sortOrder: i,
			})),
		);

		// Insert suggested diffs
		await db.insert(suggestedDiffs).values(
			entry.diffs.map((diff, i) => ({
				roastResultId: roast.id,
				lineType: diff.lineType,
				content: diff.content,
				sortOrder: i,
			})),
		);

		console.log(
			`  [${entry.submission.language}] score=${(entry.roast.score / 10).toFixed(1)} verdict=${entry.roast.verdict}`,
		);
	}

	console.log(`\nSeeded ${seedEntries.length} submissions with roast results.`);
	process.exit(0);
}

main().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
