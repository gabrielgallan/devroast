import { TRPCError } from "@trpc/server";
import { asc, eq, or } from "drizzle-orm";
import { z } from "zod/v4";
import {
	analysisIssues,
	roastResults,
	submissions,
	suggestedDiffs,
} from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";

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
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Roast result not found",
				});
			}

			return {
				id: result.id,
				score: result.score,
				verdict: result.verdict,
				roastText: result.roastText,
				language: result.submission.language,
				lineCount: result.submission.lineCount,
				code: result.submission.code,
				issues: result.issues.map((issue) => ({
					severity: issue.severity,
					title: issue.title,
					description: issue.description,
				})),
				diff: result.diffs.map((d) => ({
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
				language: z.string(),
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
					language: input.language as typeof submissions.$inferInsert.language,
					lineCount: input.lineCount,
					roastMode: input.roastMode,
				})
				.returning({ id: submissions.id });

			// TODO: Call the AI model here to generate the roast result.
			// Once implemented, the mutation should create the roast_result,
			// analysis_issues, and suggested_diffs records, then return the
			// roast result ID. For now, return the submission ID — the
			// getById procedure can look up by submission ID too.
			return { submissionId: submission.id };
		}),
});
