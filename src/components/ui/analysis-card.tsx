import { Badge, type BadgeSeverity } from "./badge";

interface AnalysisCardRootProps {
	children: React.ReactNode;
	className?: string;
}

function AnalysisCardRoot({ children, className }: AnalysisCardRootProps) {
	const classes = ["border border-border-primary p-5", className]
		.filter(Boolean)
		.join(" ");

	return <div className={classes}>{children}</div>;
}

interface AnalysisCardBadgeProps {
	severity: BadgeSeverity;
	label?: string;
	className?: string;
}

function AnalysisCardBadge({
	severity,
	label,
	className,
}: AnalysisCardBadgeProps) {
	const classes = ["mb-3", className].filter(Boolean).join(" ");

	return (
		<div className={classes}>
			<Badge severity={severity} label={label ?? severity} />
		</div>
	);
}

interface AnalysisCardTitleProps {
	children: React.ReactNode;
	className?: string;
}

function AnalysisCardTitle({ children, className }: AnalysisCardTitleProps) {
	const classes = ["mb-3 font-mono text-[13px] text-text-primary", className]
		.filter(Boolean)
		.join(" ");

	return <p className={classes}>{children}</p>;
}

interface AnalysisCardDescriptionProps {
	children: React.ReactNode;
	className?: string;
}

function AnalysisCardDescription({
	children,
	className,
}: AnalysisCardDescriptionProps) {
	const classes = [
		"font-secondary text-xs leading-relaxed text-text-secondary",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return <p className={classes}>{children}</p>;
}

const AnalysisCard = {
	Root: AnalysisCardRoot,
	Badge: AnalysisCardBadge,
	Title: AnalysisCardTitle,
	Description: AnalysisCardDescription,
};

export {
	AnalysisCard,
	type AnalysisCardRootProps,
	type AnalysisCardBadgeProps,
	type AnalysisCardTitleProps,
	type AnalysisCardDescriptionProps,
};
