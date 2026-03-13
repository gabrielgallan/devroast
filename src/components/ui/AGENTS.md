# UI Components — Coding Guidelines

## Export

- Always use **named exports**. Never use `export default`.
- Export the component function and its props type together at the end of the file:

```tsx
export { Button, type ButtonProps };
```

## Component Declaration

- Always declare components as **function declarations** (`function Button()`), never as arrow functions or `const`.
- Destructure props directly in the function signature with defaults:

```tsx
function Button({ className, variant = "primary", ...props }: ButtonProps) {
	return <button className={classes} {...props} />;
}
```

## Props — Extending Native HTML Elements

- When the component wraps a **specific, semantic HTML element** (`button`, `img`, `input`, `a`, `textarea`, `select`, etc.), **extend its native props** so every native attribute is available to the consumer:

```tsx
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary";
}
```

- **Do not extend** native props for generic layout wrappers (`div`, `span`, `section`). These are not reusable HTML primitives.
- Always spread `...props` onto the underlying element so native attributes (e.g., `onClick`, `disabled`, `type`, `aria-*`) are forwarded.

## Styling

- Use **Tailwind CSS** utility classes exclusively. No CSS modules, no inline styles.
- Use design tokens defined in `globals.css` via `@theme` (e.g., `bg-accent-green`, `text-text-primary`, `border-border-primary`).
- Never hardcode color hex values in components when a token exists. Use the token.
- Accept a `className` prop and merge it with internal classes so consumers can extend or override styles.
- Build the final class string with an array + `.filter(Boolean).join(" ")` pattern:

```tsx
const classes = [
	"base-classes",
	variantClasses[variant],
	className,
]
	.filter(Boolean)
	.join(" ");
```

## Variants & Sizes

- Define variant/size options as union types (`type ButtonVariant = "primary" | "secondary"`).
- Map each variant/size to its Tailwind classes via `Record<Variant, string>` objects — no complex runtime logic, no conditional ternaries.
- Always set sensible defaults for optional props (e.g., `variant = "primary"`, `size = "default"`).

## File Structure

- One component per file.
- File name in kebab-case matching the component name (e.g., `button.tsx` for `Button`).
- Place all UI components in `src/components/ui/`.

## Component Showcase — `/components` Page

Every UI component **must** have a visual showcase section on the `/components` page (`src/app/components/page.tsx`). This serves as a living reference for all available variants, states, and usage patterns.

### Section Structure

Each component gets a `<section>` that follows this exact layout:

```tsx
{/* ComponentName */}
<section className="mb-16">
	<h2 className="mb-1 text-lg font-bold text-text-primary">
		{"$ ComponentName"}
	</h2>
	<p className="mb-8 text-xs text-text-tertiary">
		src/components/ui/component-name.tsx
	</p>

	{/* Group: variant/prop name */}
	<div className="mb-10">
		<h3 className="mb-4 text-sm text-text-secondary">{"// group_name"}</h3>
		<div className="flex flex-wrap items-center gap-4">
			{/* render each variant/state here */}
		</div>
	</div>
</section>
```

### Rules

1. **Section header** — `<h2>` with `$ ComponentName` (PascalCase, matching the export), followed by `<p>` with the source file path relative to the project root.
2. **Groups** — Each distinct prop axis (variants, sizes, types, states) gets its own `<div className="mb-10">` block with a `<h3>` sub-header using `// snake_case_name` (e.g., `// severities`, `// types`, `// disabled`). The last group in a section omits `mb-10`.
3. **Enumerate all values** — Every variant/size/type value must be rendered. Use `.map()` over a `const` array when iterating union types. Render each value with a visible label so the viewer can identify it.
4. **Interactive states** — Show `disabled`, `defaultChecked`, checked/unchecked, and any other meaningful states as separate groups when the component supports them.
5. **Composition showcase** — For components that compose others (e.g., `AnalysisCard` uses `Badge`), show one example per severity/variant to demonstrate the composition.
6. **Constrained width** — Components that expand horizontally (cards, code blocks, diff lines) should be wrapped in `max-w-sm`, `max-w-md`, `max-w-lg`, or `max-w-xl` as appropriate.
7. **Layout containers** — Use `flex flex-wrap items-center gap-N` for inline components (badges, buttons, toggles). Use `flex flex-col gap-N` for stacked components (cards, diff lines).

### Example — Component With Variants

```tsx
const badgeSeverities = ["critical", "warning", "good"] as const;

{/* Badge */}
<section className="mb-16">
	<h2 className="mb-1 text-lg font-bold text-text-primary">
		{"$ Badge"}
	</h2>
	<p className="mb-8 text-xs text-text-tertiary">
		src/components/ui/badge.tsx
	</p>

	<div className="mb-10">
		<h3 className="mb-4 text-sm text-text-secondary">{"// severities"}</h3>
		<div className="flex flex-wrap items-center gap-6">
			{badgeSeverities.map((severity) => (
				<Badge key={severity} severity={severity} label={severity} />
			))}
		</div>
	</div>

	<div>
		<h3 className="mb-4 text-sm text-text-secondary">{"// custom_label"}</h3>
		<div className="flex flex-wrap items-center gap-6">
			<Badge severity="critical" label="needs_serious_help" />
			<Badge severity="warning" label="could_be_better" />
			<Badge severity="good" label="looks_clean" />
		</div>
	</div>
</section>
```

## Component Template — HTML Element Wrapper

Use this template when the component wraps a semantic HTML element (`button`, `input`, `a`, `img`, etc.):

```tsx
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "sm" | "default" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
	primary: "bg-accent-green text-[#0A0A0A]",
	secondary: "bg-transparent text-text-primary border border-border-primary",
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
		"inline-flex items-center justify-center gap-2 font-mono font-medium",
		variantClasses[variant],
		sizeClasses[size],
		className,
	]
		.filter(Boolean)
		.join(" ");

	return <button className={classes} {...props} />;
}

export { Button, type ButtonProps };
```

## Component Template — Non-HTML Wrapper

Use this template for components that don't map to a single semantic HTML element (cards, sections, layouts):

```tsx
interface CardProps {
	title: string;
	children: React.ReactNode;
	className?: string;
}

function Card({ title, children, className }: CardProps) {
	return (
		<div className={className}>
			<h2>{title}</h2>
			{children}
		</div>
	);
}

export { Card, type CardProps };
```
