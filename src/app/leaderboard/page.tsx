import { CodeBlock } from "@/components/ui/code-block";

const leaderboardEntries = [
	{
		rank: 1,
		score: 1.2,
		language: "javascript",
		lines: 3,
		code: `eval(prompt("enter code"))\ndocument.write(response)\n// trust the user lol`,
	},
	{
		rank: 2,
		score: 1.8,
		language: "typescript",
		lines: 3,
		code: `if (x == true) { return true; }\nelse if (x == false) { return false; }\nelse { return !false; }`,
	},
	{
		rank: 3,
		score: 2.1,
		language: "sql",
		lines: 2,
		code: `SELECT * FROM users WHERE 1=1\n-- TODO: add authentication`,
	},
	{
		rank: 4,
		score: 2.3,
		language: "java",
		lines: 3,
		code: `catch (e) {\n  // ignore\n}`,
	},
	{
		rank: 5,
		score: 2.5,
		language: "javascript",
		lines: 3,
		code: `const sleep = (ms) =>\n  new Date(Date.now() + ms)\n  while(new Date() < end) {}`,
	},
];

export default function LeaderboardPage() {
	return (
		<main className="flex flex-col items-center px-20 pt-10 pb-10">
			{/* Hero Section */}
			<section className="flex w-full max-w-320 flex-col gap-4">
				<div className="flex items-center gap-3">
					<span className="font-mono text-[32px] font-bold text-accent-green">
						{">"}
					</span>
					<h1 className="font-mono text-[28px] font-bold text-text-primary">
						shame_leaderboard
					</h1>
				</div>
				<p className="font-secondary text-sm text-text-secondary">
					{"// the most roasted code on the internet"}
				</p>
				<div className="flex items-center gap-2">
					<span className="font-secondary text-xs text-text-tertiary">
						2,847 submissions
					</span>
					<span className="font-secondary text-xs text-text-tertiary">
						{"·"}
					</span>
					<span className="font-secondary text-xs text-text-tertiary">
						avg score: 4.2/10
					</span>
				</div>
			</section>

			{/* Leaderboard Entries */}
			<section className="mt-10 flex w-full max-w-320 flex-col gap-5">
				{leaderboardEntries.map((entry) => (
					<article key={entry.rank} className="border border-border-primary">
						{/* Meta Row */}
						<div className="flex h-12 items-center justify-between border-b border-border-primary px-5">
							<div className="flex items-center gap-4">
								<span className="flex items-center gap-1.5 font-mono text-[13px]">
									<span className="text-text-tertiary">#</span>
									<span className="font-bold text-accent-amber">
										{entry.rank}
									</span>
								</span>
								<span className="flex items-center gap-1.5 font-mono text-xs">
									<span className="text-text-tertiary">score:</span>
									<span className="text-[13px] font-bold text-accent-red">
										{entry.score.toFixed(1)}
									</span>
								</span>
							</div>
							<div className="flex items-center gap-3">
								<span className="font-mono text-xs text-text-secondary">
									{entry.language}
								</span>
								<span className="font-mono text-xs text-text-tertiary">
									{entry.lines} lines
								</span>
							</div>
						</div>

						{/* Code Block */}
						<div className="flex h-30 overflow-hidden bg-bg-input">
							{/* Line Numbers */}
							<div className="flex w-10 flex-col items-end gap-1.5 border-r border-border-primary bg-bg-surface px-2.5 pt-3.5">
								{Array.from({ length: entry.lines }, (_, i) => i + 1).map(
									(lineNum) => (
										<span
											key={`ln-${lineNum}`}
											className="font-mono text-xs leading-[18px] text-text-tertiary"
										>
											{lineNum}
										</span>
									),
								)}
							</div>

							{/* Syntax-highlighted Code */}
							<div className="flex-1 overflow-hidden">
								<CodeBlock.Content
									code={entry.code}
									language={entry.language}
									className="!p-3.5 !pl-4"
								/>
							</div>
						</div>
					</article>
				))}
			</section>
		</main>
	);
}
