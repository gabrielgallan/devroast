type BadgeSeverity = "critical" | "warning" | "good";

interface BadgeProps {
	severity: BadgeSeverity;
	label: string;
	className?: string;
}

const severityClasses: Record<BadgeSeverity, string> = {
	critical: "text-accent-red",
	warning: "text-accent-amber",
	good: "text-accent-green",
};

const dotClasses: Record<BadgeSeverity, string> = {
	critical: "bg-accent-red",
	warning: "bg-accent-amber",
	good: "bg-accent-green",
};

function Badge({ severity, label, className }: BadgeProps) {
	const classes = [
		"inline-flex items-center gap-2 font-mono text-xs",
		severityClasses[severity],
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<span className={classes}>
			<span className={`block h-2 w-2 rounded-full ${dotClasses[severity]}`} />
			{label}
		</span>
	);
}

export { Badge, type BadgeProps, type BadgeSeverity };
