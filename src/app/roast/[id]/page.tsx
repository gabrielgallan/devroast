import { AnalysisCard } from "@/components/ui/analysis-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { DiffLine } from "@/components/ui/diff-line";
import { ScoreRing } from "@/components/ui/score-ring";

const roastData = {
	score: 3.5,
	verdict: "needs_serious_help" as const,
	roastQuote:
		'"this code looks like it was written during a power outage... in 2005."',
	language: "javascript",
	lines: 7,
	code: `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    if (items[i].price) {
      total = total + items[i].price;
    } else {
      total = total + 0;
      // TODO: handle missing price
    }
  }
  return total;
}

// Usage
var result = calculateTotal(cart);
console.log(result);`,
	issues: [
		{
			severity: "critical" as const,
			title: "using var instead of const/let",
			description:
				"var is function-scoped and gets hoisted, leading to subtle bugs. Always prefer const for values that don't change and let for ones that do.",
		},
		{
			severity: "warning" as const,
			title: "imperative loop pattern",
			description:
				"A simple .reduce() would replace this entire for-loop with a single, readable expression. Embrace functional patterns.",
		},
		{
			severity: "good" as const,
			title: "clear naming conventions",
			description:
				"calculateTotal, items, price — these names clearly communicate intent. This is one of the few things done right here.",
		},
		{
			severity: "good" as const,
			title: "single responsibility",
			description:
				"The function does one thing: calculate a total. Despite the rough implementation, the scope is well-defined.",
		},
	],
	diff: {
		filename: "your_code.ts → improved_code.ts",
		lines: [
			{ type: "context" as const, content: "function calculateTotal(items) {" },
			{ type: "removed" as const, content: "  var total = 0;" },
			{
				type: "removed" as const,
				content: "  for (var i = 0; i < items.length; i++) {",
			},
			{
				type: "removed" as const,
				content: "    if (items[i].price) {",
			},
			{
				type: "removed" as const,
				content: "      total = total + items[i].price;",
			},
			{ type: "removed" as const, content: "    }" },
			{
				type: "added" as const,
				content:
					"  return items.reduce((sum, item) => sum + (item.price ?? 0), 0);",
			},
			{ type: "context" as const, content: "}" },
		],
	},
};

const codeLineCount = roastData.code.split("\n").length;

function SectionTitle({ children }: { children: React.ReactNode }) {
	return (
		<h2 className="flex items-center gap-2 font-mono text-sm font-bold">
			<span className="text-accent-green">{"//"}</span>
			<span className="text-text-primary">{children}</span>
		</h2>
	);
}

export default async function RoastResultPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id: _id } = await params;

	return (
		<main className="flex flex-col items-center px-20 py-10">
			<div className="flex w-full max-w-320 flex-col gap-10">
				{/* Score Hero Section */}
				<section className="flex items-center gap-12">
					<ScoreRing score={roastData.score} />
					<div className="flex flex-col gap-4">
						<Badge
							severity="critical"
							label={`verdict: ${roastData.verdict}`}
						/>
						<p className="font-secondary text-xl leading-relaxed text-text-primary">
							{roastData.roastQuote}
						</p>
						<div className="flex items-center gap-4">
							<span className="font-mono text-xs text-text-tertiary">
								lang: {roastData.language}
							</span>
							<span className="font-mono text-xs text-text-tertiary">
								{"·"}
							</span>
							<span className="font-mono text-xs text-text-tertiary">
								{roastData.lines} lines
							</span>
						</div>
						<div>
							<Button variant="ghost" size="sm">
								{"$ share_roast"}
							</Button>
						</div>
					</div>
				</section>

				{/* Divider */}
				<div className="h-px w-full bg-border-primary" />

				{/* Submitted Code Section */}
				<section className="flex flex-col gap-4">
					<SectionTitle>your_submission</SectionTitle>
					<div className="flex h-106 overflow-hidden border border-border-primary bg-bg-input">
						{/* Line Numbers */}
						<div className="flex w-12 flex-col items-end gap-2 border-r border-border-primary bg-bg-surface px-3 py-4">
							{Array.from({ length: codeLineCount }, (_, i) => i + 1).map(
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
								code={roastData.code}
								language={roastData.language}
							/>
						</div>
					</div>
				</section>

				{/* Divider */}
				<div className="h-px w-full bg-border-primary" />

				{/* Analysis Section */}
				<section className="flex flex-col gap-6">
					<SectionTitle>detailed_analysis</SectionTitle>
					<div className="grid grid-cols-2 gap-5">
						{roastData.issues.map((issue) => (
							<AnalysisCard.Root key={issue.title}>
								<AnalysisCard.Badge severity={issue.severity} />
								<AnalysisCard.Title>{issue.title}</AnalysisCard.Title>
								<AnalysisCard.Description>
									{issue.description}
								</AnalysisCard.Description>
							</AnalysisCard.Root>
						))}
					</div>
				</section>

				{/* Divider */}
				<div className="h-px w-full bg-border-primary" />

				{/* Diff Section */}
				<section className="flex flex-col gap-6">
					<SectionTitle>suggested_fix</SectionTitle>
					<div className="overflow-hidden border border-border-primary bg-bg-input">
						{/* Diff Header */}
						<div className="flex h-10 items-center border-b border-border-primary px-4">
							<span className="font-mono text-xs text-text-tertiary">
								{roastData.diff.filename}
							</span>
						</div>

						{/* Diff Body */}
						<div className="py-1">
							{roastData.diff.lines.map((line) => (
								<DiffLine key={`${line.type}-${line.content}`} type={line.type}>
									{line.content}
								</DiffLine>
							))}
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}
