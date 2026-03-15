import { avg, count } from "drizzle-orm";
import { roastResults } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";

export const statsRouter = createTRPCRouter({
	getStats: baseProcedure.query(async ({ ctx }) => {
		const result = await ctx.db
			.select({
				totalRoasted: count(),
				avgScore: avg(roastResults.score),
			})
			.from(roastResults);

		return {
			totalRoasted: result[0]?.totalRoasted ?? 0,
			avgScore: Number(result[0]?.avgScore ?? 0),
		};
	}),
});
