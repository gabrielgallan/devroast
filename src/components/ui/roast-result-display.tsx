"use client";

import { useQuery } from "@tanstack/react-query";
import { AnalysisCard } from "@/components/ui/analysis-card";
import { Badge } from "@/components/ui/badge";
import { DiffLine } from "@/components/ui/diff-line";
import { RoastResultSkeleton } from "@/components/ui/roast-result-skeleton";
import { ScoreRing } from "@/components/ui/score-ring";
import { useTRPC } from "@/trpc/client";

const verdictSeverity: Record<string, "critical" | "warning" | "good"> = {
  needs_serious_help: "critical",
  could_be_better: "warning",
  looks_clean: "good",
};

interface RoastResultDisplayProps {
  submissionId: string;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 font-mono text-sm font-bold">
      <span className="text-accent-green">{"//"}</span>
      <span className="text-text-primary">{children}</span>
    </h2>
  );
}

function RoastResultDisplay({ submissionId }: RoastResultDisplayProps) {
  const trpc = useTRPC();

  const { data, error, isLoading } = useQuery({
    ...trpc.roast.getById.queryOptions({ id: submissionId }),
    refetchInterval: (query) => {
      const state = query.state.data;
      if (!state || state.status === "pending") {
        return 2000;
      }

      return false;
    },
    refetchIntervalInBackground: false,
  });

  if (error) {
    return (
      <div className="border border-accent-red bg-bg-surface p-6">
        <h2 className="font-mono text-sm font-bold text-accent-red">
          analysis_failed
        </h2>
        <p className="mt-2 font-secondary text-sm text-text-secondary">
          {error.message}
        </p>
      </div>
    );
  }

  if (isLoading || !data || data.status === "pending") {
    return <RoastResultSkeleton />;
  }

  const roast = data;

  if (roast.errorMessage) {
    return (
      <div className="border border-accent-red bg-bg-surface p-6">
        <h2 className="font-mono text-sm font-bold text-accent-red">
          analysis_failed
        </h2>
        <p className="mt-2 font-secondary text-sm text-text-secondary">
          {roast.errorMessage}
        </p>
      </div>
    );
  }

  const displayScore = roast.score / 10;
  const codeLineCount = roast.code.split("\n").length;
  const severity = verdictSeverity[roast.verdict] ?? "warning";

  return (
    <div className="flex w-full max-w-7xl flex-col gap-10">
      <section className="flex items-center gap-12">
        <ScoreRing score={displayScore} className="shrink-0" />
        <div className="flex flex-col gap-4">
          <Badge severity={severity} label={`verdict: ${roast.verdict}`} />
          <p className="font-secondary text-xl leading-relaxed text-text-primary">
            {`"${roast.roastText}"`}
          </p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-text-tertiary">
              lang: {roast.language}
            </span>
            <span className="font-mono text-xs text-text-tertiary">{"·"}</span>
            <span className="font-mono text-xs text-text-tertiary">
              {roast.lineCount} lines
            </span>
          </div>
        </div>
      </section>

      <div className="h-px w-full bg-border-primary" />

      <section className="flex flex-col gap-4">
        <SectionTitle>your_submission</SectionTitle>
        <div className="overflow-hidden border border-border-primary bg-bg-input">
          <div className="flex max-h-75">
            <div className="flex w-12 shrink-0 flex-col items-end border-r border-border-primary bg-bg-surface px-3 py-4">
              {Array.from({ length: codeLineCount }, (_, i) => i + 1).map(
                (lineNum) => (
                  <span
                    key={`ln-${lineNum}`}
                    className="block h-4.5 font-mono text-xs leading-4.5 text-text-tertiary"
                  >
                    {lineNum}
                  </span>
                ),
              )}
            </div>
            <div className="min-w-0 flex-1 overflow-x-auto p-4 font-mono text-xs leading-4.5">
              <div
                className="[&_code]:block [&_pre]:!m-0 [&_pre]:!p-0 [&_pre]:!bg-transparent [&_pre]:leading-[18px]"
                dangerouslySetInnerHTML={{
                  __html: roast.highlightedCodeHtml,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="h-px w-full bg-border-primary" />

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

      <div className="h-px w-full bg-border-primary" />

      {roast.diffs.length > 0 && (
        <section className="flex flex-col gap-6">
          <SectionTitle>suggested_fix</SectionTitle>
          <div className="overflow-hidden border border-border-primary bg-bg-input">
            <div className="flex h-10 items-center border-b border-border-primary px-4">
              <span className="font-mono text-xs text-text-tertiary">
                {"your_code → improved_code"}
              </span>
            </div>
            <div className="py-1">
              {roast.diffs.map((line) => (
                <DiffLine key={`diff-${line.sortOrder}`} type={line.type}>
                  {line.content}
                </DiffLine>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export { RoastResultDisplay, type RoastResultDisplayProps };
