import { TRPCError } from "@trpc/server";
import { asc, eq, or } from "drizzle-orm";
import { codeToHtml } from "shiki";
import { z } from "zod/v4";
import type { db } from "@/db/index";
import {
	analysisIssues,
	roastResults,
	submissions,
	suggestedDiffs,
} from "@/db/schema";
import { formatErrorMessage, generateRoastAnalysis } from "@/lib/openai";
import { baseProcedure, createTRPCRouter } from "../init";

async function scheduleAnalysis(
	submissionId: string,
	code: string,
	language: string,
	roastMode: boolean,
	database: typeof db,
): Promise<void> {
	try {
		const analysis = await generateRoastAnalysis(code, language, roastMode);

		// Transaction: ensure all inserts succeed or all fail
		await database.transaction(async (tx) => {
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

			// Save issues
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

			// Save diffs
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
		// Save error for display
		const errorMessage = formatErrorMessage(error);
		await database.insert(roastResults).values({
			submissionId,
			score: 0,
			verdict: "needs_serious_help",
			roastText: "Analysis failed",
			errorMessage,
			model: "gpt-4o",
		});
	}
}

function getHighlightLanguage(language: string): string {
	const languageMap: Record<string, string> = {
		unknown: "plaintext",
		markdown: "md",
	};

	return languageMap[language] ?? language;
}

async function buildHighlightedCodeHtml(
	code: string,
	language: string,
): Promise<string> {
	const highlightLanguage = getHighlightLanguage(language);

	try {
		return await codeToHtml(code, {
			lang: highlightLanguage,
			theme: "vesper",
		});
	} catch {
		return await codeToHtml(code, {
			lang: "plaintext",
			theme: "vesper",
		});
	}
}

export const roastRouter = createTRPCRouter({
	getById: baseProcedure
		.input(z.object({ id: z.uuid() }))
		.query(async ({ ctx, input }) => {
			// Look up by roastResults.id or by submissionId so both
			// leaderboard links (roast ID) and fresh submissions work.
			const result = await ctx.db.query.roastResults.findFirst({
				where: or(
					eq(roastResults.id, input.id),
					eq(roastResults.submissionId, input.id),
				),
				with: {
					submission: true,
					issues: {
						orderBy: [asc(analysisIssues.sortOrder)],
					},
					diffs: {
						orderBy: [asc(suggestedDiffs.sortOrder)],
					},
				},
			});

			if (!result) {
				const submission = await ctx.db.query.submissions.findFirst({
					where: eq(submissions.id, input.id),
					columns: { id: true },
				});

				if (submission) {
					return {
						status: "pending" as const,
					};
				}

				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Roast result not found",
				});
			}

			const highlightedCodeHtml = await buildHighlightedCodeHtml(
				result.submission.code,
				result.submission.language,
			);

			return {
				status: "ready" as const,
				id: result.id,
				score: result.score,
				verdict: result.verdict,
				roastText: result.roastText,
				errorMessage: result.errorMessage,
				language: result.submission.language,
				lineCount: result.submission.lineCount,
				code: result.submission.code,
				highlightedCodeHtml,
				issues: result.issues.map((issue) => ({
					severity: issue.severity,
					title: issue.title,
					description: issue.description,
				})),
				diffs: result.diffs.map((d) => ({
					type: d.lineType,
					content: d.content,
					sortOrder: d.sortOrder,
				})),
			};
		}),

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
			void scheduleAnalysis(
				submission.id,
				input.code,
				input.language,
				input.roastMode,
				ctx.db,
			).catch((err) => {
				console.error("[scheduleAnalysis] Unhandled error:", err);
				// TODO: log to monitoring service (e.g., Sentry) if available
			});

			return { submissionId: submission.id };
		}),
});
