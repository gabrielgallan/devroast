"use client";

import { Switch } from "@base-ui-components/react/switch";

interface ToggleProps {
	label?: string;
	checked?: boolean;
	defaultChecked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	className?: string;
}

function Toggle({
	label,
	checked,
	defaultChecked,
	onCheckedChange,
	className,
}: ToggleProps) {
	const classes = ["inline-flex items-center gap-3", className]
		.filter(Boolean)
		.join(" ");

	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: Switch.Root renders an input internally
		<label className={classes}>
			<Switch.Root
				checked={checked}
				defaultChecked={defaultChecked}
				onCheckedChange={onCheckedChange}
				className="relative flex h-5.5 w-10 items-center rounded-[11px] bg-border-primary p-[3px] transition-colors data-[checked]:bg-accent-green"
			>
				<Switch.Thumb className="block h-4 w-4 rounded-full bg-text-secondary transition-transform data-[checked]:translate-x-[18px] data-[checked]:bg-bg-page" />
			</Switch.Root>
			{label && (
				<span className="font-mono text-xs text-text-secondary transition-colors [label:has([data-checked])_&]:text-accent-green">
					{label}
				</span>
			)}
		</label>
	);
}

export { Toggle, type ToggleProps };
