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

## Responsive Sizing — No Fixed Pixel Values

- **Never use arbitrary pixel values** for `width`, `height`, `max-width`, `max-height`, `min-width`, or `min-height` (e.g., `w-[240px]`, `h-[360px]`, `max-w-[780px]`).
- Instead, **use Tailwind's default spacing scale** which is rem-based and scales with the user's font-size preferences. Convert `px` to the Tailwind unit by dividing by 4 (e.g., `780px / 4 = 195` → `max-w-195`).
- Common conversions:

| Pixel value | Tailwind class | Rem equivalent |
|---|---|---|
| `w-[50px]` | `w-12.5` | `3.125rem` |
| `w-[70px]` | `w-17.5` | `4.375rem` |
| `w-[100px]` | `w-25` | `6.25rem` |
| `h-[360px]` | `h-90` | `22.5rem` |
| `max-w-[780px]` | `max-w-195` | `48.75rem` |

- This rule applies to **dimensional properties only** (width, height, max/min variants). Arbitrary pixel values for `font-size`, `line-height`, `border-radius`, and `padding` are acceptable when no standard Tailwind class matches the design intent (e.g., `text-[13px]`, `leading-[18px]`, `rounded-[11px]`).

## Variants & Sizes

- Define variant/size options as union types (`type ButtonVariant = "primary" | "secondary"`).
- Map each variant/size to its Tailwind classes via `Record<Variant, string>` objects — no complex runtime logic, no conditional ternaries.
- Always set sensible defaults for optional props (e.g., `variant = "primary"`, `size = "default"`).

## Composition Pattern

When a component renders **multiple distinct sub-elements** (e.g., a card with badge, title, and description), use the **composition pattern** instead of passing content via props. This gives consumers full control over ordering, omitting, or extending sub-elements.

### When to Use Composition

- The component has **3+ visual sub-elements** that a consumer might want to reorder, omit, or extend.
- Sub-elements are **semantically distinct** (e.g., title vs description vs badge — not just styling variants).

### When NOT to Use Composition

- **Atomic components** with 1–2 elements (Badge, Button, Toggle) — keep them prop-driven.
- **Self-contained stateful components** where decomposition would break internal logic (CodeEditor).
- Components where sub-elements are **derived from config**, not content (DiffLine prefix is derived from `type`).

### Namespace Object Export

Export sub-components as a namespace object so consumers use `Component.SubComponent` syntax without importing each piece:

```tsx
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
```

### Sub-Component Rules

1. **Root** — Always the outermost container. Accepts `children: React.ReactNode` and `className?: string`.
2. **Each sub-component** — Accepts `className?: string` so consumers can override styles. Content sub-components accept `children: React.ReactNode`.
3. **Internal defaults** — Sub-components apply their own base styles (spacing, typography) via the array + `.filter(Boolean).join(" ")` pattern.
4. **Props for config, children for content** — Sub-components that need configuration (e.g., `severity`) take it as a prop. Rendered text/nodes come through `children`.

### Template — Composed Component

```tsx
interface CardRootProps {
	children: React.ReactNode;
	className?: string;
}

function CardRoot({ children, className }: CardRootProps) {
	const classes = ["border border-border-primary p-5", className]
		.filter(Boolean)
		.join(" ");
	return <div className={classes}>{children}</div>;
}

interface CardTitleProps {
	children: React.ReactNode;
	className?: string;
}

function CardTitle({ children, className }: CardTitleProps) {
	const classes = ["mb-3 font-mono text-[13px] text-text-primary", className]
		.filter(Boolean)
		.join(" ");
	return <p className={classes}>{children}</p>;
}

const Card = {
	Root: CardRoot,
	Title: CardTitle,
};

export { Card, type CardRootProps, type CardTitleProps };
```

### Usage

```tsx
<Card.Root>
	<Card.Title>my title</Card.Title>
</Card.Root>
```

### Current Composed Components

| Component | Sub-components |
|---|---|
| `AnalysisCard` | `Root`, `Badge`, `Title`, `Description` |
| `CodeBlock` | `Root`, `Header`, `Content` |

## Skeleton Components for Suspense

When a component loads data asynchronously (e.g., via `useSuspenseQuery`), export a matching `*Skeleton` component from the **same file**. This skeleton is used as the `<Suspense fallback>` in the parent server component.

```tsx
export function StatsBar() {
	// ... uses useSuspenseQuery to load data
}

export function StatsBarSkeleton() {
	return (
		<div className="flex items-center justify-center gap-6">
			<span className="inline-block h-4 w-36 animate-pulse rounded bg-bg-elevated" />
		</div>
	);
}
```

### Rules

- Name the skeleton `<ComponentName>Skeleton` (e.g., `StatsBarSkeleton`).
- Export it as a **named export** alongside the main component — this is the only exception to "one component per file".
- Match the skeleton's layout dimensions to the real component to prevent layout shift.
- Use `animate-pulse` with `bg-bg-elevated` for placeholder blocks.
- The skeleton is a **server component** (no `"use client"`) even though it lives in the same file as a client component — React handles this correctly because the skeleton is only imported and rendered by the server component parent.

## General Rules

- One component per file (exception: skeleton components live alongside their data-loading counterpart).
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
