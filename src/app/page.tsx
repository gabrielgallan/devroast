import { Suspense } from "react";
import { CodeEditor } from "@/components/ui/code-editor";
import {
	ShameLeaderboard,
	ShameLeaderboardSkeleton,
} from "@/components/ui/shame-leaderboard";
import { StatsBar, StatsBarSkeleton } from "@/components/ui/stats-bar";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

export default function Home() {
	prefetch(trpc.stats.getStats.queryOptions());

	return (
		<HydrateClient>
			<main className="flex flex-col items-center px-10 pt-20 pb-0">
				{/* Hero title block */}
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-3">
						<span className="font-mono text-4xl font-bold text-accent-green">
							$
						</span>
						<h1 className="font-mono text-4xl font-bold text-text-primary">
							paste your code. get roasted.
						</h1>
					</div>
					<p className="font-secondary text-sm text-text-secondary">
						{
							"// drop your code below and we'll rate it — brutally honest or full roast mode"
						}
					</p>
				</div>

				{/* Code editor */}
				<div className="mt-8 w-full max-w-195">
					<CodeEditor />
				</div>

				{/* Footer stats */}
				<div className="mt-8">
					<Suspense fallback={<StatsBarSkeleton />}>
						<StatsBar />
					</Suspense>
				</div>

				{/* Spacer */}
				<div className="h-15" />

				{/* Leaderboard preview */}
				<Suspense fallback={<ShameLeaderboardSkeleton />}>
					<ShameLeaderboard />
				</Suspense>

				{/* Bottom pad */}
				<div className="h-15" />
			</main>
		</HydrateClient>
	);
}
