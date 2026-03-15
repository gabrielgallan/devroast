"use client";

import { cpp } from "@codemirror/lang-cpp";
import { css } from "@codemirror/lang-css";
import { go } from "@codemirror/lang-go";
import { html } from "@codemirror/lang-html";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { useMutation } from "@tanstack/react-query";
import { createTheme } from "@uiw/codemirror-themes";
import CodeMirror from "@uiw/react-codemirror";
import hljs from "highlight.js/lib/core";
import hljsCpp from "highlight.js/lib/languages/cpp";
import hljsCss from "highlight.js/lib/languages/css";
import hljsGo from "highlight.js/lib/languages/go";
import hljsJava from "highlight.js/lib/languages/java";
import hljsJavascript from "highlight.js/lib/languages/javascript";
import hljsJson from "highlight.js/lib/languages/json";
import hljsMarkdown from "highlight.js/lib/languages/markdown";
import hljsPhp from "highlight.js/lib/languages/php";
import hljsPython from "highlight.js/lib/languages/python";
import hljsRust from "highlight.js/lib/languages/rust";
import hljsSql from "highlight.js/lib/languages/sql";
import hljsTypescript from "highlight.js/lib/languages/typescript";
import hljsXml from "highlight.js/lib/languages/xml";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { useTRPC } from "@/trpc/client";

/* ------------------------------------------------------------------ */
/*  highlight.js — language auto-detection                            */
/* ------------------------------------------------------------------ */

hljs.registerLanguage("javascript", hljsJavascript);
hljs.registerLanguage("typescript", hljsTypescript);
hljs.registerLanguage("python", hljsPython);
hljs.registerLanguage("rust", hljsRust);
hljs.registerLanguage("go", hljsGo);
hljs.registerLanguage("xml", hljsXml);
hljs.registerLanguage("css", hljsCss);
hljs.registerLanguage("json", hljsJson);
hljs.registerLanguage("sql", hljsSql);
hljs.registerLanguage("cpp", hljsCpp);
hljs.registerLanguage("java", hljsJava);
hljs.registerLanguage("php", hljsPhp);
hljs.registerLanguage("markdown", hljsMarkdown);

const HLJS_LANGUAGE_SUBSET = [
	"javascript",
	"typescript",
	"python",
	"rust",
	"go",
	"xml",
	"css",
	"json",
	"sql",
	"cpp",
	"java",
	"php",
	"markdown",
];

const DETECTION_RELEVANCE_THRESHOLD = 7;
const DETECTION_DEBOUNCE_MS = 500;
const MAX_LINES = 2000;

/* ------------------------------------------------------------------ */
/*  highlight.js name → CodeMirror language key                       */
/* ------------------------------------------------------------------ */

const HLJS_TO_CM: Record<string, string> = {
	javascript: "javascript",
	typescript: "typescript",
	python: "python",
	rust: "rust",
	go: "go",
	xml: "html",
	css: "css",
	json: "json",
	sql: "sql",
	cpp: "cpp",
	java: "java",
	php: "php",
	markdown: "markdown",
};

/* ------------------------------------------------------------------ */
/*  CodeMirror language extensions                                    */
/* ------------------------------------------------------------------ */

type LanguageKey =
	| "javascript"
	| "typescript"
	| "python"
	| "rust"
	| "go"
	| "html"
	| "css"
	| "json"
	| "sql"
	| "cpp"
	| "java"
	| "php"
	| "markdown";

const LANGUAGE_EXTENSIONS: Record<LanguageKey, () => Extension> = {
	javascript: () => javascript({ jsx: true, typescript: false }),
	typescript: () => javascript({ jsx: true, typescript: true }),
	python: () => python(),
	rust: () => rust(),
	go: () => go(),
	html: () => html(),
	css: () => css(),
	json: () => json(),
	sql: () => sql(),
	java: () => java(),
	cpp: () => cpp(),
	php: () => php(),
	markdown: () => markdown(),
};

const LANGUAGE_LABELS: Record<LanguageKey, string> = {
	javascript: "javascript",
	typescript: "typescript",
	python: "python",
	rust: "rust",
	go: "go",
	html: "html",
	css: "css",
	json: "json",
	sql: "sql",
	cpp: "c/c++",
	java: "java",
	php: "php",
	markdown: "markdown",
};

const LANGUAGE_KEYS = Object.keys(LANGUAGE_EXTENSIONS) as LanguageKey[];

/* ------------------------------------------------------------------ */
/*  DevRoast theme                                                    */
/* ------------------------------------------------------------------ */

const devroastTheme = createTheme({
	theme: "dark",
	settings: {
		background: "#101010",
		foreground: "#FFFFFF",
		caret: "#FFC799",
		selection: "#FFFFFF25",
		selectionMatch: "#FFFFFF15",
		lineHighlight: "transparent",
		gutterBackground: "#101010",
		gutterForeground: "#505050",
		gutterBorder: "#282828",
		fontFamily: '"JetBrains Mono", monospace',
	},
	styles: [
		{ tag: t.keyword, color: "#A0A0A0" },
		{ tag: t.controlKeyword, color: "#A0A0A0" },
		{ tag: t.operatorKeyword, color: "#A0A0A0" },
		{ tag: t.definitionKeyword, color: "#A0A0A0" },
		{ tag: t.moduleKeyword, color: "#A0A0A0" },
		{
			tag: [
				t.function(t.variableName),
				t.function(t.definition(t.variableName)),
			],
			color: "#FFC799",
		},
		{ tag: t.variableName, color: "#FFFFFF" },
		{ tag: [t.string, t.special(t.brace)], color: "#99FFE4" },
		{ tag: t.number, color: "#FFC799" },
		{ tag: [t.propertyName, t.definition(t.propertyName)], color: "#FFFFFF" },
		{ tag: [t.typeName, t.className, t.namespace], color: "#FFC799" },
		{ tag: t.operator, color: "#A0A0A0" },
		{ tag: t.punctuation, color: "#A0A0A0" },
		{ tag: t.bracket, color: "#A0A0A0" },
		{ tag: t.comment, color: "#8B8B8B94", fontStyle: "italic" },
		{ tag: t.meta, color: "#A0A0A0" },
		{ tag: t.tagName, color: "#FFC799" },
		{ tag: t.attributeName, color: "#FFC799" },
		{ tag: t.attributeValue, color: "#99FFE4" },
		{ tag: t.bool, color: "#FFC799" },
		{ tag: t.null, color: "#FFC799" },
		{ tag: t.self, color: "#A0A0A0" },
		{ tag: t.atom, color: "#FFC799" },
		{ tag: t.regexp, color: "#A0A0A0" },
		{ tag: t.escape, color: "#A0A0A0" },
	],
});

/* ------------------------------------------------------------------ */
/*  Editor base styles (font size, line height, padding)              */
/* ------------------------------------------------------------------ */

const editorBaseStyles = EditorView.theme({
	"&": {
		fontSize: "12px",
	},
	".cm-content": {
		padding: "16px 0",
		fontFamily: '"JetBrains Mono", monospace',
		fontSize: "12px",
		lineHeight: "18px",
	},
	".cm-line": {
		padding: "0 16px",
	},
	".cm-gutters": {
		borderRight: "1px solid #282828",
		paddingLeft: "8px",
		paddingRight: "8px",
		minWidth: "48px",
	},
	".cm-gutter.cm-lineNumbers .cm-gutterElement": {
		fontFamily: '"JetBrains Mono", monospace',
		fontSize: "12px",
		lineHeight: "18px",
		padding: "0",
		minWidth: "auto",
	},
	".cm-scroller": {
		overflow: "auto",
		scrollbarWidth: "thin",
		scrollbarColor: "#34343480 transparent",
	},
	".cm-scroller::-webkit-scrollbar": {
		width: "6px",
		height: "6px",
	},
	".cm-scroller::-webkit-scrollbar-track": {
		background: "transparent",
	},
	".cm-scroller::-webkit-scrollbar-thumb": {
		background: "#34343480",
		borderRadius: "3px",
	},
	".cm-scroller::-webkit-scrollbar-thumb:hover": {
		background: "#505050",
	},
	".cm-focused": {
		outline: "none",
	},
	".cm-placeholder": {
		color: "#505050",
		fontStyle: "normal",
	},
	".cm-activeLine": {
		backgroundColor: "transparent",
	},
	".cm-activeLineGutter": {
		backgroundColor: "transparent",
	},
});

/* ------------------------------------------------------------------ */
/*  CodeEditor component                                              */
/* ------------------------------------------------------------------ */

interface CodeEditorProps {
	className?: string;
}

function CodeEditor({ className }: CodeEditorProps) {
	const [code, setCode] = useState("");
	const [language, setLanguage] = useState<LanguageKey>("javascript");
	const [isManualLanguage, setIsManualLanguage] = useState(false);
	const [selectorOpen, setSelectorOpen] = useState(false);
	const [roastMode, setRoastMode] = useState(true);

	const router = useRouter();
	const trpc = useTRPC();
	const submitMutation = useMutation(
		trpc.roast.submit.mutationOptions({
			onSuccess: (data) => {
				router.push(`/roast/${data.submissionId}`);
			},
		}),
	);

	const lineCount = code.split("\n").length;
	const exceedsLimit = lineCount > MAX_LINES;

	const detectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const selectorRef = useRef<HTMLDivElement>(null);

	/* language auto-detection ------------------------------------ */

	const detectLanguage = useCallback(
		(text: string) => {
			if (isManualLanguage || !text.trim()) return;

			try {
				const result = hljs.highlightAuto(text, HLJS_LANGUAGE_SUBSET);

				if (
					result.language &&
					result.relevance >= DETECTION_RELEVANCE_THRESHOLD
				) {
					const cmKey = HLJS_TO_CM[result.language];

					if (cmKey && cmKey in LANGUAGE_EXTENSIONS) {
						setLanguage(cmKey as LanguageKey);
					}
				}
			} catch {
				/* detection failed — keep current language */
			}
		},
		[isManualLanguage],
	);

	useEffect(() => {
		if (isManualLanguage) return;

		if (detectTimerRef.current) {
			clearTimeout(detectTimerRef.current);
		}

		detectTimerRef.current = setTimeout(() => {
			detectLanguage(code);
		}, DETECTION_DEBOUNCE_MS);

		return () => {
			if (detectTimerRef.current) {
				clearTimeout(detectTimerRef.current);
			}
		};
	}, [code, detectLanguage, isManualLanguage]);

	/* close selector on outside click ---------------------------- */

	useEffect(() => {
		if (!selectorOpen) return;

		function handleClickOutside(e: MouseEvent) {
			if (
				selectorRef.current &&
				!selectorRef.current.contains(e.target as Node)
			) {
				setSelectorOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [selectorOpen]);

	/* language selector handler ---------------------------------- */

	function handleLanguageSelect(key: LanguageKey) {
		setLanguage(key);
		setIsManualLanguage(true);
		setSelectorOpen(false);
	}

	/* CodeMirror extensions -------------------------------------- */

	const extensions = useMemo<Extension[]>(() => {
		const langExtension = LANGUAGE_EXTENSIONS[language]();
		return [langExtension, editorBaseStyles, EditorView.lineWrapping];
	}, [language]);

	/* onChange handler ------------------------------------------- */

	const handleChange = useCallback((value: string) => {
		setCode(value);
	}, []);

	/* submit handler -------------------------------------------- */

	function handleSubmit() {
		submitMutation.mutate({
			code,
			language,
			lineCount,
			roastMode,
		});
	}

	/* classes ---------------------------------------------------- */

	const classes = ["flex w-full max-w-195 flex-col", className]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={classes}>
			<div className="flex h-90 flex-col border border-border-primary bg-bg-input">
				{/* header */}

				<div className="relative z-50 flex h-10 shrink-0 items-center justify-between border-b border-border-primary px-4">
					<div className="flex items-center gap-2">
						<span className="h-3 w-3 rounded-full bg-accent-red" />
						<span className="h-3 w-3 rounded-full bg-accent-amber" />
						<span className="h-3 w-3 rounded-full bg-accent-green" />
					</div>

					{/* language selector */}

					<div ref={selectorRef} className="relative">
						<button
							type="button"
							onClick={() => setSelectorOpen(!selectorOpen)}
							className="font-mono text-xs text-text-tertiary transition-colors hover:text-text-secondary"
						>
							{LANGUAGE_LABELS[language]}
							<span className="ml-1.5 text-text-tertiary/50">{"▾"}</span>
						</button>

						{selectorOpen && (
							<div className="absolute right-0 top-full z-50 mt-1 max-h-52 w-36 overflow-y-auto border border-border-primary bg-bg-elevated">
								{LANGUAGE_KEYS.map((key) => (
									<button
										key={key}
										type="button"
										onClick={() => handleLanguageSelect(key)}
										className={[
											"flex w-full items-center px-3 py-1.5 text-left font-mono text-xs bg-bg-input transition-colors hover:bg-bg-surface",
											key === language
												? "text-accent-green"
												: "text-text-secondary",
										].join(" ")}
									>
										{LANGUAGE_LABELS[key]}
									</button>
								))}
							</div>
						)}
					</div>
				</div>

				{/* editor */}

				<div className="relative min-h-0 flex-1">
					<div className="absolute inset-0 overflow-auto">
						<CodeMirror
							value={code}
							onChange={handleChange}
							theme={devroastTheme}
							extensions={extensions}
							placeholder="// paste your code here..."
							height="100%"
							basicSetup={{
								lineNumbers: true,
								highlightActiveLineGutter: false,
								foldGutter: false,
								dropCursor: true,
								allowMultipleSelections: false,
								indentOnInput: true,
								bracketMatching: true,
								closeBrackets: false,
								autocompletion: false,
								rectangularSelection: false,
								crosshairCursor: false,
								highlightActiveLine: false,
								highlightSelectionMatches: false,
								searchKeymap: false,
								foldKeymap: false,
								completionKeymap: false,
								lintKeymap: false,
								tabSize: 4,
							}}
						/>
					</div>

					{exceedsLimit && (
						<div className="pointer-events-none absolute inset-0 z-10">
							<div className="pointer-events-auto absolute bottom-3 right-3 flex items-center gap-2 border border-accent-red/30 bg-bg-elevated px-3 py-2 font-mono text-xs text-accent-red">
								<span>{"!"}</span>
								<span>
									{`line limit exceeded: ${lineCount.toLocaleString()}/${MAX_LINES.toLocaleString()}`}
								</span>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* actions */}

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
					disabled={
						code.trim().length === 0 || exceedsLimit || submitMutation.isPending
					}
					onClick={handleSubmit}
				>
					{submitMutation.isPending ? "$ roasting..." : "$ roast_my_code"}
				</Button>
			</div>
		</div>
	);
}

export { CodeEditor, type CodeEditorProps };
