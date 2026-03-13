import { AnalysisCard } from "@/components/ui/analysis-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { CodeEditor } from "@/components/ui/code-editor";
import { DiffLine } from "@/components/ui/diff-line";
import { Navbar } from "@/components/ui/navbar";
import { ScoreRing } from "@/components/ui/score-ring";
import { Toggle } from "@/components/ui/toggle";

const buttonVariants = [
	"primary",
	"secondary",
	"ghost",
	"destructive",
] as const;
const buttonSizes = ["sm", "default", "lg"] as const;
const badgeSeverities = ["critical", "warning", "good"] as const;
const diffLineTypes = ["removed", "added", "context"] as const;

const sampleCode = `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  return total;
}`;

const shortCode = `const sum = (a, b) => a + b;`;

export default function ComponentsPage() {
	return (
		<div className="min-h-screen bg-bg-page p-12 font-mono text-text-primary">
			<h1 className="mb-2 text-2xl font-bold text-accent-green">
				{"// components"}
			</h1>
			<p className="mb-12 text-sm text-text-secondary">UI component showcase</p>

			{/* Button */}
			<section className="mb-16">
				<h2 className="mb-1 text-lg font-bold text-text-primary">
					{"$ Button"}
				</h2>
				<p className="mb-8 text-xs text-text-tertiary">
					src/components/ui/button.tsx
				</p>

				<div className="mb-10">
					<h3 className="mb-4 text-sm text-text-secondary">{"// variants"}</h3>
					<div className="flex flex-wrap items-center gap-4">
						{buttonVariants.map((variant) => (
							<Button key={variant} variant={variant}>
								{`$ ${variant}`}
							</Button>
						))}
					</div>
				</div>

				<div className="mb-10">
					<h3 className="mb-4 text-sm text-text-secondary">{"// sizes"}</h3>
					<div className="flex flex-wrap items-center gap-4">
						{buttonSizes.map((size) => (
							<Button key={size} size={size}>
								{`$ ${size}`}
							</Button>
						))}
					</div>
				</div>

				<div className="mb-10">
					<h3 className="mb-4 text-sm text-text-secondary">
						{"// variants_x_sizes"}
					</h3>
					<div className="flex flex-col gap-4">
						{buttonVariants.map((variant) => (
							<div key={variant} className="flex flex-wrap items-center gap-4">
								{buttonSizes.map((size) => (
									<Button
										key={`${variant}-${size}`}
										variant={variant}
										size={size}
									>
										{`$ ${variant}_${size}`}
									</Button>
								))}
							</div>
						))}
					</div>
				</div>

				<div>
					<h3 className="mb-4 text-sm text-text-secondary">{"// disabled"}</h3>
					<div className="flex flex-wrap items-center gap-4">
						{buttonVariants.map((variant) => (
							<Button key={variant} variant={variant} disabled>
								{`$ ${variant}`}
							</Button>
						))}
					</div>
				</div>
			</section>

			{/* Badge */}
			<section className="mb-16">
				<h2 className="mb-1 text-lg font-bold text-text-primary">
					{"$ Badge"}
				</h2>
				<p className="mb-8 text-xs text-text-tertiary">
					src/components/ui/badge.tsx
				</p>

				<div className="mb-10">
					<h3 className="mb-4 text-sm text-text-secondary">
						{"// severities"}
					</h3>
					<div className="flex flex-wrap items-center gap-6">
						{badgeSeverities.map((severity) => (
							<Badge key={severity} severity={severity} label={severity} />
						))}
					</div>
				</div>

				<div>
					<h3 className="mb-4 text-sm text-text-secondary">
						{"// custom_label"}
					</h3>
					<div className="flex flex-wrap items-center gap-6">
						<Badge severity="critical" label="needs_serious_help" />
						<Badge severity="warning" label="could_be_better" />
						<Badge severity="good" label="looks_clean" />
					</div>
				</div>
			</section>

			{/* DiffLine */}
			<section className="mb-16">
				<h2 className="mb-1 text-lg font-bold text-text-primary">
					{"$ DiffLine"}
				</h2>
				<p className="mb-8 text-xs text-text-tertiary">
					src/components/ui/diff-line.tsx
				</p>

				<div className="mb-10">
					<h3 className="mb-4 text-sm text-text-secondary">{"// types"}</h3>
					<div className="flex flex-col max-w-xl">
						{diffLineTypes.map((type) => (
							<DiffLine key={type} type={type}>
								{`// ${type} line`}
							</DiffLine>
						))}
					</div>
				</div>

				<div>
					<h3 className="mb-4 text-sm text-text-secondary">
						{"// realistic_diff"}
					</h3>
					<div className="flex flex-col max-w-xl">
						<DiffLine type="removed">var total = 0;</DiffLine>
						<DiffLine type="added">const total = 0;</DiffLine>
						<DiffLine type="context">
							{"for (let i = 0; i < items.length; i++) {"}
						</DiffLine>
					</div>
				</div>
			</section>

			{/* Toggle */}
			<section className="mb-16">
				<h2 className="mb-1 text-lg font-bold text-text-primary">
					{"$ Toggle"}
				</h2>
				<p className="mb-8 text-xs text-text-tertiary">
					src/components/ui/toggle.tsx
				</p>

				<div className="mb-10">
					<h3 className="mb-4 text-sm text-text-secondary">{"// states"}</h3>
					<div className="flex flex-wrap items-center gap-8">
						<Toggle label="checked" defaultChecked />
						<Toggle label="unchecked" />
					</div>
				</div>

				<div>
					<h3 className="mb-4 text-sm text-text-secondary">
						{"// without_label"}
					</h3>
					<div className="flex flex-wrap items-center gap-8">
						<Toggle defaultChecked />
						<Toggle />
					</div>
				</div>
			</section>

			{/* AnalysisCard */}
			<section className="mb-16">
				<h2 className="mb-1 text-lg font-bold text-text-primary">
					{"$ AnalysisCard"}
				</h2>
				<p className="mb-8 text-xs text-text-tertiary">
					src/components/ui/analysis-card.tsx
				</p>

				<div>
					<h3 className="mb-4 text-sm text-text-secondary">
						{"// severities"}
					</h3>
					<div className="flex flex-col gap-4 max-w-lg">
						<AnalysisCard
							severity="critical"
							title="using var instead of const/let"
							description="the var keyword is function-scoped rather than block-scoped, which can lead to unexpected behavior and bugs. modern javascript uses const for immutable bindings and let for mutable ones."
						/>
						<AnalysisCard
							severity="warning"
							title="no error handling in async function"
							description="this async function doesn't have a try/catch block. unhandled promise rejections can crash your application in production."
						/>
						<AnalysisCard
							severity="good"
							title="clean function naming"
							description="the function name clearly describes what it does, making the code self-documenting and easier for other developers to understand."
						/>
					</div>
				</div>
			</section>

			{/* CodeBlock */}
			<section className="mb-16">
				<h2 className="mb-1 text-lg font-bold text-text-primary">
					{"$ CodeBlock"}
				</h2>
				<p className="mb-8 text-xs text-text-tertiary">
					src/components/ui/code-block.tsx
				</p>

				<div className="mb-10">
					<h3 className="mb-4 text-sm text-text-secondary">
						{"// with_filename"}
					</h3>
					<div className="max-w-xl">
						<CodeBlock
							code={sampleCode}
							language="javascript"
							filename="calculate.js"
						/>
					</div>
				</div>

				<div>
					<h3 className="mb-4 text-sm text-text-secondary">
						{"// without_filename"}
					</h3>
					<div className="max-w-xl">
						<CodeBlock code={shortCode} language="javascript" />
					</div>
				</div>
			</section>

			{/* ScoreRing */}
			<section className="mb-16">
				<h2 className="mb-1 text-lg font-bold text-text-primary">
					{"$ ScoreRing"}
				</h2>
				<p className="mb-8 text-xs text-text-tertiary">
					src/components/ui/score-ring.tsx
				</p>

				<div>
					<h3 className="mb-4 text-sm text-text-secondary">
						{"// score_ranges"}
					</h3>
					<div className="flex flex-wrap items-center gap-8">
						<ScoreRing score={2.1} />
						<ScoreRing score={5.5} />
						<ScoreRing score={8.7} />
					</div>
				</div>
			</section>

			{/* Navbar */}
			<section className="mb-16">
				<h2 className="mb-1 text-lg font-bold text-text-primary">
					{"$ Navbar"}
				</h2>
				<p className="mb-8 text-xs text-text-tertiary">
					src/components/ui/navbar.tsx
				</p>

				<div>
					<h3 className="mb-4 text-sm text-text-secondary">{"// default"}</h3>
					<div className="max-w-3xl border border-border-primary">
						<Navbar />
					</div>
				</div>
			</section>

			{/* CodeEditor */}
			<section className="mb-16">
				<h2 className="mb-1 text-lg font-bold text-text-primary">
					{"$ CodeEditor"}
				</h2>
				<p className="mb-8 text-xs text-text-tertiary">
					src/components/ui/code-editor.tsx
				</p>

				<div>
					<h3 className="mb-4 text-sm text-text-secondary">{"// default"}</h3>
					<div className="max-w-3xl">
						<CodeEditor />
					</div>
				</div>
			</section>
		</div>
	);
}
