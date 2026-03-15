import { codeToHtml } from "shiki";

interface CodeBlockRootProps {
	children: React.ReactNode;
	className?: string;
}

function CodeBlockRoot({ children, className }: CodeBlockRootProps) {
	const classes = [
		"overflow-hidden border border-border-primary bg-bg-input",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return <div className={classes}>{children}</div>;
}

interface CodeBlockHeaderProps {
	filename?: string;
	className?: string;
}

function CodeBlockHeader({ filename, className }: CodeBlockHeaderProps) {
	const classes = [
		"flex h-10 items-center gap-3 border-b border-border-primary px-4",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={classes}>
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
	);
}

interface CodeBlockContentProps {
	code: string;
	language?: string;
	className?: string;
}

// Renders shiki-generated HTML — input is trusted, not user-supplied
async function CodeBlockContent({
	code,
	language = "javascript",
	className,
}: CodeBlockContentProps) {
	const html = await codeToHtml(code, {
		lang: language,
		theme: "vesper",
	});

	const classes = [
		"overflow-x-auto p-4 font-mono text-xs leading-[18px]",
		"[&_code]:block",
		"[&_pre]:!m-0",
		"[&_pre]:!p-0",
		"[&_pre]:!bg-transparent",
		"[&_pre]:leading-[18px]",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return <div className={classes} dangerouslySetInnerHTML={{ __html: html }} />;
}

const CodeBlock = {
	Root: CodeBlockRoot,
	Header: CodeBlockHeader,
	Content: CodeBlockContent,
};

export {
	CodeBlock,
	type CodeBlockRootProps,
	type CodeBlockHeaderProps,
	type CodeBlockContentProps,
};
