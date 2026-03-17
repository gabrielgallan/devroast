import { asc, avg, count, eq, isNull } from "drizzle-orm";
import { z } from "zod/v4";
import { roastResults, submissions } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";

export const leaderboardRouter = createTRPCRouter({
	getTopWorst: baseProcedure.query(async ({ ctx }) => {
		const validRoastsOnly = isNull(roastResults.errorMessage);

		const [entries, countResult] = await Promise.all([
			ctx.db
				.select({
					roastId: roastResults.id,
					score: roastResults.score,
					code: submissions.code,
					language: submissions.language,
					lineCount: submissions.lineCount,
				})
				.from(roastResults)
				.innerJoin(submissions, eq(roastResults.submissionId, submissions.id))
				.where(validRoastsOnly)
				.orderBy(asc(roastResults.score))
				.limit(3),
			ctx.db
				.select({ total: count() })
				.from(roastResults)
				.where(validRoastsOnly),
		]);

		return {
			entries: entries.map((entry, i) => ({
				rank: i + 1,
				roastId: entry.roastId,
				score: entry.score,
				code: entry.code,
				language: entry.language,
				lineCount: entry.lineCount,
			})),
			totalCount: countResult[0]?.total ?? 0,
		};
	}),

	getAll: baseProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(100).default(50),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const limit = input?.limit ?? 50;
			const validRoastsOnly = isNull(roastResults.errorMessage);

			const [entries, countResult, avgResult] = await Promise.all([
				ctx.db
					.select({
						roastId: roastResults.id,
						score: roastResults.score,
						code: submissions.code,
						language: submissions.language,
						lineCount: submissions.lineCount,
					})
					.from(roastResults)
					.innerJoin(submissions, eq(roastResults.submissionId, submissions.id))
					.where(validRoastsOnly)
					.orderBy(asc(roastResults.score))
					.limit(limit),
				ctx.db
					.select({ total: count() })
					.from(roastResults)
					.where(validRoastsOnly),
				ctx.db
					.select({ avg: avg(roastResults.score) })
					.from(roastResults)
					.where(validRoastsOnly),
			]);

			return {
				entries: entries.map((entry, i) => ({
					rank: i + 1,
					roastId: entry.roastId,
					score: entry.score,
					code: entry.code,
					language: entry.language,
					lineCount: entry.lineCount,
				})),
				totalCount: countResult[0]?.total ?? 0,
				avgScore: Number(avgResult[0]?.avg ?? 0),
			};
		}),
});
