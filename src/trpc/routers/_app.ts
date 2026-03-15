import { createTRPCRouter } from "../init";
import { statsRouter } from "./stats";

export const appRouter = createTRPCRouter({
	stats: statsRouter,
});

export type AppRouter = typeof appRouter;
