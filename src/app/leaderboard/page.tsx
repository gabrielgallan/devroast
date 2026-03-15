import Link from "next/link";
import { CodeBlock } from "@/components/ui/code-block";
import { caller } from "@/trpc/server";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const { entries, totalCount, avgScore } = await caller.leaderboard.getAll();

  const displayAvg = (avgScore / 10).toFixed(1);

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
            {totalCount.toLocaleString()} submissions
          </span>
          <span className="font-secondary text-xs text-text-tertiary">
            {"·"}
          </span>
          <span className="font-secondary text-xs text-text-tertiary">
            avg score: {displayAvg}/10
          </span>
        </div>
      </section>

      {/* Leaderboard Entries */}
      <section className="mt-10 flex w-full max-w-320 flex-col gap-5">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <Link
              key={entry.roastId}
              href={`/roast/${entry.roastId}`}
              className="block transition-colors hover:border-text-tertiary"
            >
              <article className="border border-border-primary">
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
                        {(entry.score / 10).toFixed(1)}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-text-secondary">
                      {entry.language}
                    </span>
                    <span className="font-mono text-xs text-text-tertiary">
                      {entry.lineCount} lines
                    </span>
                  </div>
                </div>

                {/* Code Block */}
                <div className="flex h-30 overflow-hidden bg-bg-input">
                  {/* Line Numbers */}
                  <div className="flex w-10 flex-col items-end gap-1.5 border-r border-border-primary bg-bg-surface px-2.5 pt-3.5">
                    {Array.from(
                      {
                        length: Math.min(entry.lineCount, 3),
                      },
                      (_, i) => i + 1,
                    ).map((lineNum) => (
                      <span
                        key={`ln-${lineNum}`}
                        className="font-mono text-xs leading-4.5 text-text-tertiary"
                      >
                        {lineNum}
                      </span>
                    ))}
                  </div>

                  {/* Syntax-highlighted Code */}
                  <div className="flex-1 overflow-hidden">
                    <CodeBlock.Content
                      code={entry.code.split("\n").slice(0, 3).join("\n")}
                      language={entry.language}
                      className="p-3.5! pl-4!"
                    />
                  </div>
                </div>
              </article>
            </Link>
          ))
        ) : (
          <div className="flex items-center justify-center border border-border-primary px-5 py-16">
            <p className="font-secondary text-sm text-text-tertiary">
              {"// no roasts yet — be the first to get roasted"}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
