import { codeToHtml } from "shiki";

interface CodeBlockProps {
	code: string;
	language?: string;
	filename?: string;
	className?: string;
}

// Renders shiki-generated HTML — input is trusted, not user-supplied
function CodeContent({ html }: { html: string }) {
	return (
		<div
			className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed [&_code]:block [&_pre]:!bg-transparent"
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}

async function CodeBlock({
	code,
	language = "javascript",
	filename,
	className,
}: CodeBlockProps) {
	const html = await codeToHtml(code, {
		lang: language,
		theme: "vesper",
	});

	const classes = [
		"overflow-hidden border border-border-primary bg-bg-input",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={classes}>
			{/* Header with traffic light dots and filename */}
			<div className="flex h-10 items-center gap-3 border-b border-border-primary px-4">
				<span className="h-2.5 w-2.5 rounded-full bg-accent-red" />
				<span className="h-2.5 w-2.5 rounded-full bg-accent-amber" />
				<span className="h-2.5 w-2.5 rounded-full bg-accent-green" />
				{filename && (
					<>
						<span className="flex-1" />
						<span className="font-mono text-xs text-text-tertiary">
							{filename}
						</span>
					</>
				)}
			</div>

			{/* Code content — shiki output (HTML is sanitized by shiki, not user input) */}
			<CodeContent html={html} />
		</div>
	);
}

export { CodeBlock, type CodeBlockProps };
