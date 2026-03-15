import Link from "next/link";
import { Suspense } from "react";
import { CodeEditor } from "@/components/ui/code-editor";
import { StatsBar, StatsBarSkeleton } from "@/components/ui/stats-bar";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

const leaderboardData = [
	{
		rank: 1,
		score: 1.2,
		code: `eval(prompt("Enter code"));\ndocument.write(result);\nalert("done");`,
		lang: "javascript",
	},
	{
		rank: 2,
		score: 1.8,
		code: `if (x == true) { return true; }\nelse if (x == false) { return false; }\nelse { return null; }`,
		lang: "typescript",
	},
	{
		rank: 3,
		score: 2.1,
		code: `SELECT * FROM users WHERE name = '${`' OR 1=1 --`}';\nDROP TABLE users;`,
		lang: "sql",
	},
];

const rankClasses: Record<number, string> = {
	1: "text-accent-amber",
	2: "text-text-secondary",
	3: "text-text-secondary",
};

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
						{leaderboardData.map((row, i) => (
							<div
								key={row.rank}
								className={[
									"flex px-5 py-4",
									i < leaderboardData.length - 1
										? "border-b border-border-primary"
										: "",
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
									{row.score.toFixed(1)}
								</span>
								<pre className="flex-1 font-mono text-xs leading-relaxed text-text-secondary">
									{row.code}
								</pre>
								<span className="w-25 text-right font-mono text-xs text-text-tertiary">
									{row.lang}
								</span>
							</div>
						))}
					</div>

					{/* Table footer hint */}
					<p className="py-4 text-center font-secondary text-xs text-text-tertiary">
						{"showing top 3 of 2,847 \u00B7 "}
						<Link
							href="/leaderboard"
							className="transition-colors hover:text-text-secondary"
						>
							{"view full leaderboard >>"}
						</Link>
					</p>
				</section>

				{/* Bottom pad */}
				<div className="h-15" />
			</main>
		</HydrateClient>
	);
}
