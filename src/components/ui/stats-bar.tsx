"use client";

import NumberFlow from "@number-flow/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function StatsBar() {
	const trpc = useTRPC();
	const { data } = useSuspenseQuery(trpc.stats.getStats.queryOptions());

	return (
		<div className="flex items-center justify-center gap-6">
			<span className="font-secondary text-xs text-text-tertiary">
				<NumberFlow value={data.totalRoasted} format={{ useGrouping: true }} />{" "}
				codes roasted
			</span>
			<span className="text-text-tertiary">&middot;</span>
			<span className="font-secondary text-xs text-text-tertiary">
				avg score:{" "}
				<NumberFlow
					value={data.avgScore}
					format={{
						minimumFractionDigits: 1,
						maximumFractionDigits: 1,
					}}
					suffix="/10"
				/>
			</span>
		</div>
	);
}

export function StatsBarSkeleton() {
	return (
		<div className="flex items-center justify-center gap-6">
			<span className="inline-block h-4 w-36 animate-pulse rounded bg-bg-elevated" />
			<span className="text-text-tertiary">&middot;</span>
			<span className="inline-block h-4 w-32 animate-pulse rounded bg-bg-elevated" />
		</div>
	);
}
