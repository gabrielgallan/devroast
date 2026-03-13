"use client";

import {
	Cell,
	Label,
	RadialBar,
	RadialBarChart,
	ResponsiveContainer,
} from "recharts";

interface ScoreRingProps {
	score: number;
	maxScore?: number;
	size?: number;
	className?: string;
}

function getScoreColor(score: number, max: number): string {
	const ratio = score / max;
	if (ratio >= 0.7) return "var(--color-accent-green)";
	if (ratio >= 0.4) return "var(--color-accent-amber)";
	return "var(--color-accent-red)";
}

function ScoreRing({
	score,
	maxScore = 10,
	size = 180,
	className,
}: ScoreRingProps) {
	const color = getScoreColor(score, maxScore);
	const data = [{ value: score, fill: color }];

	const classes = ["inline-block", className].filter(Boolean).join(" ");

	return (
		<div className={classes} style={{ width: size, height: size }}>
			<ResponsiveContainer width="100%" height="100%">
				<RadialBarChart
					cx="50%"
					cy="50%"
					innerRadius="80%"
					outerRadius="100%"
					startAngle={90}
					endAngle={-270}
					data={data}
					barSize={4}
				>
					<RadialBar
						dataKey="value"
						cornerRadius={2}
						background={{ fill: "var(--color-border-primary)" }}
					>
						<Cell fill={color} />
					</RadialBar>
					<Label
						content={({ viewBox }) => {
							const cx = (viewBox as { cx: number }).cx;
							const cy = (viewBox as { cy: number }).cy;
							return (
								<g>
									<text
										x={cx}
										y={cy - 4}
										textAnchor="middle"
										dominantBaseline="central"
										className="font-mono text-5xl font-bold"
										fill={color}
									>
										{score}
									</text>
									<text
										x={cx}
										y={cy + 32}
										textAnchor="middle"
										dominantBaseline="central"
										className="font-mono text-base"
										fill="var(--color-text-tertiary)"
									>
										/{maxScore}
									</text>
								</g>
							);
						}}
					/>
				</RadialBarChart>
			</ResponsiveContainer>
		</div>
	);
}

export { ScoreRing, type ScoreRingProps };
