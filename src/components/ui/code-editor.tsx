"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

interface CodeEditorProps {
	className?: string;
}

const MAX_LINES = 20;

function CodeEditor({ className }: CodeEditorProps) {
	const [code, setCode] = useState("");
	const [roastMode, setRoastMode] = useState(true);

	const lineCount = Math.max(code.split("\n").length, 16);
	const displayLines = Math.min(lineCount, MAX_LINES);

	const classes = ["flex w-full max-w-[780px] flex-col", className]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={classes}>
			{/* Editor */}
			<div className="flex h-[360px] flex-col overflow-hidden border border-border-primary bg-bg-input">
				{/* Window header */}
				<div className="flex h-10 shrink-0 items-center border-b border-border-primary px-4">
					<div className="flex items-center gap-2">
						<span className="block h-3 w-3 rounded-full bg-accent-red" />
						<span className="block h-3 w-3 rounded-full bg-accent-amber" />
						<span className="block h-3 w-3 rounded-full bg-accent-green" />
					</div>
				</div>

				{/* Code area */}
				<div className="flex min-h-0 flex-1">
					{/* Line numbers */}
					<div className="flex w-12 shrink-0 flex-col gap-2 border-r border-border-primary bg-bg-surface px-3 py-4">
						{Array.from({ length: displayLines }, (_, i) => (
							<span
								// biome-ignore lint/suspicious/noArrayIndexKey: line numbers are a static ordered list
								key={i}
								className="text-right font-mono text-xs leading-[18px] text-text-tertiary"
							>
								{i + 1}
							</span>
						))}
					</div>

					{/* Textarea */}
					<textarea
						value={code}
						onChange={(e) => setCode(e.target.value)}
						placeholder="// paste your code here..."
						spellCheck={false}
						className="flex-1 resize-none bg-transparent p-4 font-mono text-xs leading-[18px] text-text-primary outline-none placeholder:text-text-tertiary"
					/>
				</div>
			</div>

			{/* Actions bar */}
			<div className="mt-4 flex w-full items-center justify-between">
				<div className="flex items-center gap-4">
					<Toggle
						label="roast_mode"
						checked={roastMode}
						onCheckedChange={setRoastMode}
					/>
					<span className="font-secondary text-xs text-text-tertiary">
						{"// maximum sarcasm enabled"}
					</span>
				</div>
				<Button
					variant="primary"
					size="default"
					disabled={code.trim().length === 0}
				>
					{"$ roast_my_code"}
				</Button>
			</div>
		</div>
	);
}

export { CodeEditor, type CodeEditorProps };
