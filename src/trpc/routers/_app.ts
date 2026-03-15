import { createTRPCRouter } from "../init";
import { leaderboardRouter } from "./leaderboard";
import { roastRouter } from "./roast";
import { statsRouter } from "./stats";

export const appRouter = createTRPCRouter({
	leaderboard: leaderboardRouter,
	roast: roastRouter,
	stats: statsRouter,
});

export type AppRouter = typeof appRouter;
