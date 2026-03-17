"use client";

import { useId } from "react";

interface ScoreRingProps {
	score: number;
	maxScore?: number;
	size?: number;
	className?: string;
}

const sizeClasses: Record<number, string> = {
	140: "h-35 w-35",
	160: "h-40 w-40",
	180: "h-45 w-45",
	200: "h-50 w-50",
};

function clampScore(score: number, maxScore: number): number {
	if (!Number.isFinite(score)) {
		return 0;
	}

	if (score < 0) {
		return 0;
	}

	if (score > maxScore) {
		return maxScore;
	}

	return score;
}

function formatScoreValue(score: number): string {
	const rounded = Math.round(score * 10) / 10;

	if (Number.isInteger(rounded)) {
		return `${rounded}`;
	}

	return rounded.toFixed(1);
}

function ScoreRing({
	score,
	maxScore = 10,
	size = 180,
	className,
}: ScoreRingProps) {
	const safeMaxScore = maxScore > 0 ? maxScore : 10;
	const safeScore = clampScore(score, safeMaxScore);
	const progress = safeScore / safeMaxScore;
	const radius = 88;
	const circumference = 2 * Math.PI * radius;
	const dashOffset = circumference * (1 - progress);
	const gradientId = useId().replace(/:/g, "");
	const valueText = formatScoreValue(safeScore);
	const valueClasses = [
		"font-mono font-bold leading-none text-text-primary tabular-nums",
		valueText.length >= 4 ? "text-4xl" : "text-5xl",
	]
		.filter(Boolean)
		.join(" ");
	const sizeClass = sizeClasses[Math.round(size)] ?? sizeClasses[180];

	const classes = [
		"relative inline-flex shrink-0 items-center justify-center",
		sizeClass,
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={classes}>
			<svg viewBox="0 0 180 180" className="h-full w-full" aria-hidden>
				<title>Score ring</title>
				<defs>
					<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="var(--color-accent-green)" />
						<stop offset="35%" stopColor="var(--color-accent-amber)" />
						<stop offset="100%" stopColor="var(--color-accent-red)" />
					</linearGradient>
				</defs>
				<circle
					cx="90"
					cy="90"
					r={radius}
					fill="none"
					stroke="var(--color-border-primary)"
					strokeWidth="4"
				/>
				<circle
					cx="90"
					cy="90"
					r={radius}
					fill="none"
					stroke={`url(#${gradientId})`}
					strokeWidth="4"
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={dashOffset}
					transform="rotate(-90 90 90)"
				/>
			</svg>
			<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
				<span className={valueClasses}>{valueText}</span>
				<span className="font-mono text-base leading-none text-text-tertiary">
					/{safeMaxScore}
				</span>
			</div>
		</div>
	);
}

export { ScoreRing, type ScoreRingProps };
