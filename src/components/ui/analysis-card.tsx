import { Badge, type BadgeSeverity } from "./badge";

interface AnalysisCardProps {
	severity: BadgeSeverity;
	title: string;
	description: string;
	className?: string;
}

function AnalysisCard({
	severity,
	title,
	description,
	className,
}: AnalysisCardProps) {
	const classes = ["border border-border-primary p-5", className]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={classes}>
			<div className="mb-3">
				<Badge severity={severity} label={severity} />
			</div>
			<p className="mb-3 font-mono text-[13px] text-text-primary">{title}</p>
			<p className="font-secondary text-xs leading-relaxed text-text-secondary">
				{description}
			</p>
		</div>
	);
}

export { AnalysisCard, type AnalysisCardProps };
