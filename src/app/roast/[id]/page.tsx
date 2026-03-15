import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";
import { AnalysisCard } from "@/components/ui/analysis-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { DiffLine } from "@/components/ui/diff-line";
import { ScoreRing } from "@/components/ui/score-ring";
import { caller } from "@/trpc/server";

export const dynamic = "force-dynamic";

function SectionTitle({ children }: { children: React.ReactNode }) {
	return (
		<h2 className="flex items-center gap-2 font-mono text-sm font-bold">
			<span className="text-accent-green">{"//"}</span>
			<span className="text-text-primary">{children}</span>
		</h2>
	);
}

const verdictSeverity: Record<string, "critical" | "warning" | "good"> = {
	needs_serious_help: "critical",
	could_be_better: "warning",
	looks_clean: "good",
};

export default async function RoastResultPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const roast = await caller.roast.getById({ id }).catch((e) => {
		if (e instanceof TRPCError && e.code === "NOT_FOUND") {
			notFound();
		}
		throw e;
	});

	const displayScore = roast.score / 10;
	const codeLineCount = roast.code.split("\n").length;
	const severity = verdictSeverity[roast.verdict] ?? "warning";

	return (
		<main className="flex flex-col items-center px-20 py-10">
			<div className="flex w-full max-w-320 flex-col gap-10">
				{/* Score Hero Section */}
				<section className="flex items-center gap-12">
					<ScoreRing score={displayScore} />
					<div className="flex flex-col gap-4">
						<Badge severity={severity} label={`verdict: ${roast.verdict}`} />
						<p className="font-secondary text-xl leading-relaxed text-text-primary">
							{`"${roast.roastText}"`}
						</p>
						<div className="flex items-center gap-4">
							<span className="font-mono text-xs text-text-tertiary">
								lang: {roast.language}
							</span>
							<span className="font-mono text-xs text-text-tertiary">
								{"·"}
							</span>
							<span className="font-mono text-xs text-text-tertiary">
								{roast.lineCount} lines
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
							<CodeBlock.Content code={roast.code} language={roast.language} />
						</div>
					</div>
				</section>

				{/* Divider */}
				<div className="h-px w-full bg-border-primary" />

				{/* Analysis Section */}
				<section className="flex flex-col gap-6">
					<SectionTitle>detailed_analysis</SectionTitle>
					<div className="grid grid-cols-2 gap-5">
						{roast.issues.map((issue) => (
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
				{roast.diff.length > 0 && (
					<section className="flex flex-col gap-6">
						<SectionTitle>suggested_fix</SectionTitle>
						<div className="overflow-hidden border border-border-primary bg-bg-input">
							{/* Diff Header */}
							<div className="flex h-10 items-center border-b border-border-primary px-4">
								<span className="font-mono text-xs text-text-tertiary">
									{"your_code → improved_code"}
								</span>
							</div>

							{/* Diff Body */}
							<div className="py-1">
								{roast.diff.map((line) => (
									<DiffLine key={`diff-${line.sortOrder}`} type={line.type}>
										{line.content}
									</DiffLine>
								))}
							</div>
						</div>
					</section>
				)}
			</div>
		</main>
	);
}
