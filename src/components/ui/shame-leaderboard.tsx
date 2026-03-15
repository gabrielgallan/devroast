import Link from "next/link";
import { CodeBlock } from "@/components/ui/code-block";
import { caller } from "@/trpc/server";

const rankClasses: Record<number, string> = {
	1: "text-accent-amber",
	2: "text-text-secondary",
	3: "text-text-secondary",
};

async function ShameLeaderboard() {
	const { entries, totalCount } = await caller.leaderboard.getTopWorst();

	return (
		<section className="w-full max-w-240">
			{/* Title row */}
			<div className="flex w-full items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="font-mono text-sm font-bold text-accent-green">
						{"//"}
					</span>
					<span className="font-mono text-sm font-bold text-text-primary">
						shame_leaderboard
					</span>
				</div>
				<Link
					href="/leaderboard"
					className="border border-border-primary px-3 py-1.5 font-mono text-xs text-text-secondary transition-colors hover:text-text-primary"
				>
					{"$ view_all >>"}
				</Link>
			</div>

			{/* Subtitle */}
			<p className="mt-2 font-secondary text-[13px] text-text-tertiary">
				{"// the worst code on the internet, ranked by shame"}
			</p>

			{/* Table */}
			<div className="mt-6 w-full border border-border-primary">
				{/* Header */}
				<div className="flex h-10 items-center border-b border-border-primary bg-bg-surface px-5">
					<span className="w-12.5 font-mono text-xs font-medium text-text-tertiary">
						#
					</span>
					<span className="w-17.5 font-mono text-xs font-medium text-text-tertiary">
						score
					</span>
					<span className="flex-1 font-mono text-xs font-medium text-text-tertiary">
						code
					</span>
					<span className="w-25 text-right font-mono text-xs font-medium text-text-tertiary">
						lang
					</span>
				</div>

				{/* Rows */}
				{entries.length > 0 ? (
					entries.map((row, i) => (
						<div
							key={`${row.rank}-${row.score}`}
							className={[
								"flex px-5 py-4",
								i < entries.length - 1 ? "border-b border-border-primary" : "",
							]
								.filter(Boolean)
								.join(" ")}
						>
							<span
								className={[
									"w-12.5 font-mono text-sm font-bold",
									rankClasses[row.rank] ?? "text-text-secondary",
								].join(" ")}
							>
								{row.rank}
							</span>
							<span className="w-17.5 font-mono text-sm font-bold text-accent-red">
								{(row.score / 10).toFixed(1)}
							</span>
							<div className="flex-1 overflow-hidden">
								<CodeBlock.Content
									code={row.code.split("\n").slice(0, 3).join("\n")}
									language={row.language}
									className="!p-0 !leading-relaxed"
								/>
							</div>
							<span className="w-25 text-right font-mono text-xs text-text-tertiary">
								{row.language}
							</span>
						</div>
					))
				) : (
					<div className="flex items-center justify-center px-5 py-12">
						<p className="font-secondary text-sm text-text-tertiary">
							{"// no roasts yet — be the first to get roasted"}
						</p>
					</div>
				)}
			</div>

			{/* Table footer hint */}
			<p className="py-4 text-center font-secondary text-xs text-text-tertiary">
				{totalCount > 0 ? (
					<>
						{`showing top ${Math.min(3, totalCount)} of ${totalCount.toLocaleString()} \u00B7 `}
						<Link
							href="/leaderboard"
							className="transition-colors hover:text-text-secondary"
						>
							{"view full leaderboard >>"}
						</Link>
					</>
				) : (
					"paste your code above to start the leaderboard"
				)}
			</p>
		</section>
	);
}

function ShameLeaderboardSkeleton() {
	return (
		<section className="w-full max-w-240">
			{/* Title row */}
			<div className="flex w-full items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="font-mono text-sm font-bold text-accent-green">
						{"//"}
					</span>
					<span className="font-mono text-sm font-bold text-text-primary">
						shame_leaderboard
					</span>
				</div>
				<span className="inline-block h-7.5 w-25 animate-pulse rounded bg-bg-elevated" />
			</div>

			{/* Subtitle */}
			<p className="mt-2 font-secondary text-[13px] text-text-tertiary">
				{"// the worst code on the internet, ranked by shame"}
			</p>

			{/* Table */}
			<div className="mt-6 w-full border border-border-primary">
				{/* Header */}
				<div className="flex h-10 items-center border-b border-border-primary bg-bg-surface px-5">
					<span className="w-12.5 font-mono text-xs font-medium text-text-tertiary">
						#
					</span>
					<span className="w-17.5 font-mono text-xs font-medium text-text-tertiary">
						score
					</span>
					<span className="flex-1 font-mono text-xs font-medium text-text-tertiary">
						code
					</span>
					<span className="w-25 text-right font-mono text-xs font-medium text-text-tertiary">
						lang
					</span>
				</div>

				{/* Skeleton rows */}
				{[1, 2, 3].map((n) => (
					<div
						key={`skeleton-${n}`}
						className={[
							"flex items-center px-5 py-4",
							n < 3 ? "border-b border-border-primary" : "",
						]
							.filter(Boolean)
							.join(" ")}
					>
						<span className="w-12.5">
							<span className="inline-block h-4 w-4 animate-pulse rounded bg-bg-elevated" />
						</span>
						<span className="w-17.5">
							<span className="inline-block h-4 w-8 animate-pulse rounded bg-bg-elevated" />
						</span>
						<span className="flex-1">
							<span className="mb-1.5 block h-3.5 w-4/5 animate-pulse rounded bg-bg-elevated" />
							<span className="mb-1.5 block h-3.5 w-3/5 animate-pulse rounded bg-bg-elevated" />
							<span className="block h-3.5 w-2/5 animate-pulse rounded bg-bg-elevated" />
						</span>
						<span className="w-25 text-right">
							<span className="inline-block h-4 w-16 animate-pulse rounded bg-bg-elevated" />
						</span>
					</div>
				))}
			</div>

			{/* Footer skeleton */}
			<div className="flex justify-center py-4">
				<span className="inline-block h-4 w-60 animate-pulse rounded bg-bg-elevated" />
			</div>
		</section>
	);
}

export { ShameLeaderboard, ShameLeaderboardSkeleton };
