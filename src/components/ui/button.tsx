import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "default" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
	primary:
		"bg-accent-green text-[#0A0A0A] hover:bg-accent-green/90 active:bg-accent-green/80",
	secondary:
		"bg-transparent text-text-primary border border-border-primary hover:bg-bg-elevated active:bg-bg-surface",
	ghost:
		"bg-transparent text-text-secondary border border-border-primary hover:text-text-primary hover:bg-bg-elevated active:bg-bg-surface",
	destructive:
		"bg-accent-red text-[#0A0A0A] hover:bg-accent-red/90 active:bg-accent-red/80",
};

const sizeClasses: Record<ButtonSize, string> = {
	sm: "px-3 py-1.5 text-xs",
	default: "px-6 py-2.5 text-[13px]",
	lg: "px-8 py-3 text-sm",
};

function Button({
	className,
	variant = "primary",
	size = "default",
	...props
}: ButtonProps) {
	const classes = [
		"inline-flex items-center justify-center gap-2 font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:pointer-events-none disabled:opacity-50",
		variantClasses[variant],
		sizeClasses[size],
		className,
	]
		.filter(Boolean)
		.join(" ");

	return <button className={classes} {...props} />;
}

export { Button, type ButtonProps };
