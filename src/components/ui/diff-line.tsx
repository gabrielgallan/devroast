type DiffLineType = "added" | "removed" | "context";

interface DiffLineProps {
	type: DiffLineType;
	children: string;
	className?: string;
}

const bgClasses: Record<DiffLineType, string> = {
	added: "bg-diff-added-bg",
	removed: "bg-diff-removed-bg",
	context: "",
};

const prefixClasses: Record<DiffLineType, { char: string; color: string }> = {
	added: { char: "+", color: "text-accent-green" },
	removed: { char: "-", color: "text-accent-red" },
	context: { char: " ", color: "text-text-tertiary" },
};

const codeClasses: Record<DiffLineType, string> = {
	added: "text-text-primary",
	removed: "text-text-secondary",
	context: "text-text-secondary",
};

function DiffLine({ type, children, className }: DiffLineProps) {
	const prefix = prefixClasses[type];

	const classes = [
		"flex gap-2 px-4 py-2 font-mono text-[13px]",
		bgClasses[type],
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={classes}>
			<span className={prefix.color}>{prefix.char}</span>
			<span className={codeClasses[type]}>{children}</span>
		</div>
	);
}

export { DiffLine, type DiffLineProps, type DiffLineType };
