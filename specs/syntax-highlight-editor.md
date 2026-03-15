# Syntax-Highlighted Code Editor — Spec

Upgrade the existing `CodeEditor` component so pasted/typed code is syntax-highlighted in real time. Language is auto-detected but also manually selectable.

## Status: Implemented

Implementation complete using **CodeMirror 6** (see [Approach Decision](#approach-decision) below). File: `src/components/ui/code-editor.tsx`.

## Requirements

1. **Live syntax highlighting** — Colors appear immediately as the user types or pastes.
2. **Auto language detection** — On paste or after typing, detect the language and apply highlighting.
3. **Manual language selector** — Dropdown menu to override the detected language.
4. **Consistent theming** — Custom `devroastTheme` mapping all design tokens from `globals.css` to Lezer highlight tags.
5. **Minimal bundle impact** — CodeMirror 6 is modular; only required language packages are imported.
6. **Accessibility** — Keyboard-navigable, proper ARIA labels, native contentEditable behavior (undo/redo, selection, clipboard).

---

## Approach Decision

### Why CodeMirror 6 (not Textarea + Shiki Overlay)

The original spec recommended **Option A: Textarea + Shiki Overlay** (the ray.so technique). During implementation, this approach was built first but had **structural alignment bugs** that could not be reliably fixed:

1. **CRITICAL**: Shiki's `<pre>` used Tailwind preflight's monospace font stack, NOT `JetBrains Mono` — different glyph widths caused horizontal cursor drift.
2. **HIGH**: Missing `leading-[18px]` on the `<pre>` element — vertical drift compounded per line.
3. **MEDIUM**: `white-space`, scrollbar width, and `tab-size` mismatches between the transparent `<textarea>` and the Shiki overlay.

These are fundamental problems with the two-DOM-tree overlay approach: any font/zoom/DPI difference between the textarea and the overlay div causes visible misalignment. Patching one issue surfaces another.

### Three Approaches Evaluated

| Approach | Verdict | Reason |
|---|---|---|
| **Textarea + Shiki Overlay** | Rejected | Inherently fragile — two separate DOM trees must pixel-match |
| **CodeMirror 6** | **Chosen** | Single DOM tree (contentEditable), modular, ~80-100KB gzipped |
| **Monaco Editor** | Rejected | Same single-DOM benefit but 500KB-1MB+ gzipped, overkill |

---

## Language Detection

### highlight.js `highlightAuto()`

- **How it works:** Runs the input against every registered language grammar and scores each match by "relevance" (number of recognized keywords, patterns, structures). Returns the top match and a `secondBest`.
- **Accuracy:** Good for unambiguous languages (Python, HTML, SQL, Rust). Weaker for similar languages (JS vs TS, C vs C++). Accuracy improves when the subset is restricted to the 13 registered languages.
- **Performance:** With 13 languages registered, detection takes <5ms for typical snippets (<200 lines).

### Detection Strategy

1. On paste or after **500ms debounce** of typing, run `hljs.highlightAuto(code, HLJS_LANGUAGE_SUBSET)`.
2. Only accept the result if `relevance >= 7` (threshold to avoid false positives on short snippets).
3. If the user has manually selected a language (`isManualLanguage === true`), skip auto-detection entirely.
4. Map highlight.js language names to CodeMirror language keys via the `HLJS_TO_CM` lookup table.
5. The detected/selected language is shown in the header bar.

---

## Supported Languages

13 languages with both highlight.js detection grammars and CodeMirror language extensions:

| Language | hljs name | CodeMirror key | Package |
|---|---|---|---|
| JavaScript | `javascript` | `javascript` | `@codemirror/lang-javascript` (jsx: true) |
| TypeScript | `typescript` | `typescript` | `@codemirror/lang-javascript` (jsx: true, typescript: true) |
| Python | `python` | `python` | `@codemirror/lang-python` |
| Rust | `rust` | `rust` | `@codemirror/lang-rust` |
| Go | `go` | `go` | `@codemirror/lang-go` |
| HTML | `xml` | `html` | `@codemirror/lang-html` |
| CSS | `css` | `css` | `@codemirror/lang-css` |
| JSON | `json` | `json` | `@codemirror/lang-json` |
| SQL | `sql` | `sql` | `@codemirror/lang-sql` |
| C/C++ | `cpp` | `cpp` | `@codemirror/lang-cpp` |
| Java | `java` | `java` | `@codemirror/lang-java` |
| PHP | `php` | `php` | `@codemirror/lang-php` |
| Markdown | `markdown` | `markdown` | `@codemirror/lang-markdown` |

### Languages from original spec that were dropped

Bash, Ruby, Swift, Kotlin, YAML — no official `@codemirror/lang-*` packages available. Could be added later via community Lezer grammars if needed.

---

## Architecture

### Component Structure

```
CodeEditor (client component — "use client")
  |-- Outer container (flex col, max-w-195)
  |-- Editor container (h-90, border, bg-bg-input)
  |    |-- Header bar (h-10, traffic lights + language selector)
  |    |-- CodeMirror wrapper (flex-1, overflow-hidden)
  |         |-- <CodeMirror> from @uiw/react-codemirror
  |              |-- devroastTheme (createTheme)
  |              |-- editorBaseStyles (EditorView.theme)
  |              |-- Language extension (dynamic, from LANGUAGE_EXTENSIONS map)
  |              |-- EditorView.lineWrapping
  |              |-- basicSetup (minimal config)
  |-- Actions bar (toggle + submit button)
```

### CodeMirror Configuration

**`basicSetup` — minimal options:**
- `lineNumbers: true`
- `bracketMatching: true`
- `indentOnInput: true`
- `dropCursor: true`
- `tabSize: 4`
- Everything else OFF: `autocompletion`, `foldGutter`, `search`, `highlightActiveLine`, `highlightActiveLineGutter`, `highlightSelectionMatches`, `closeBrackets`, `rectangularSelection`, `crosshairCursor`, all keymaps

### Theming

Two theme layers:

1. **`devroastTheme`** — Created via `createTheme()` from `@uiw/codemirror-themes`. Maps design tokens to Lezer highlight tags:
   - Keywords (#c678dd), functions (#61afef), variables (#e06c75), strings (#e5c07b)
   - Numbers (#d19a66), properties (#98c379), types (#e5c07b), operators (#abb2bf)
   - Comments (#4b5563, italic), HTML tags (#e06c75), booleans/null/atoms (#d19a66)
   - Settings: background #111111, foreground #fafafa, caret #10b981, selection #10b98133
   - Gutter: background #0f0f0f, foreground #4b5563, border #2a2a2a

2. **`editorBaseStyles`** — Created via `EditorView.theme()`. Controls font-size (12px), line-height (18px), font-family (JetBrains Mono), gutter dimensions, placeholder color, transparent active line highlight.

### State

| State | Type | Purpose |
|---|---|---|
| `code` | `string` | Raw text content |
| `language` | `LanguageKey` | Detected or manually selected language (default: `"javascript"`) |
| `isManualLanguage` | `boolean` | Whether the user overrode auto-detection |
| `selectorOpen` | `boolean` | Language dropdown open state |
| `roastMode` | `boolean` | Existing roast mode toggle state |

### Language Selector

- Located in the header bar, right side, next to the traffic light dots.
- Clicking toggles a dropdown with all 13 supported languages.
- Selecting a language sets `isManualLanguage = true`, stopping auto-detection.
- Active language highlighted in `text-accent-green`.
- Dropdown uses simple `absolute` positioning with `z-50` relative to a `relative` wrapper. No portal needed.
- **Key fix**: `overflow-hidden` is only on the CodeMirror wrapper div, NOT on the outer editor container — this prevents the dropdown from being clipped.
- Outside click closes the dropdown via `mousedown` event listener.

---

## Dependencies

| Package | Purpose | Status |
|---|---|---|
| `@uiw/react-codemirror` | React wrapper for CodeMirror 6 | Added |
| `@uiw/codemirror-themes` | `createTheme` utility for custom themes | Added |
| `@lezer/highlight` | Highlight tag definitions for theme mapping | Added |
| `@codemirror/state` | Core editor state types (`Extension`) | Added |
| `@codemirror/view` | `EditorView` for base styles and line wrapping | Added |
| `@codemirror/lang-javascript` | JS/TS/JSX/TSX syntax | Added |
| `@codemirror/lang-python` | Python syntax | Added |
| `@codemirror/lang-rust` | Rust syntax | Added |
| `@codemirror/lang-go` | Go syntax | Added |
| `@codemirror/lang-html` | HTML syntax | Added |
| `@codemirror/lang-css` | CSS syntax | Added |
| `@codemirror/lang-json` | JSON syntax | Added |
| `@codemirror/lang-sql` | SQL syntax | Added |
| `@codemirror/lang-java` | Java syntax | Added |
| `@codemirror/lang-cpp` | C/C++ syntax | Added |
| `@codemirror/lang-markdown` | Markdown syntax | Added |
| `@codemirror/lang-php` | PHP syntax | Added |
| `highlight.js` | Auto language detection via `highlightAuto()` | Added |
| `shiki` | Still used by `CodeBlock` (server component) | Pre-existing, not affected |

Total: 17 new packages added.

---

## Files Modified

| File | Change |
|---|---|
| `src/components/ui/code-editor.tsx` | Major rewrite: replaced textarea+Shiki overlay with CodeMirror 6 |
| `package.json` | Added 17 CodeMirror-related + highlight.js dependencies |
| `pnpm-lock.yaml` | Updated lockfile |

---

## Open Questions (Resolved)

1. **Language selector UI** — Resolved: Custom dropdown matching the terminal aesthetic, positioned absolutely in the header bar.
2. **Max input size** — Not yet addressed. CodeMirror handles large documents well, but a limit may be needed for the roast API.
3. **Tab behavior** — Resolved: CodeMirror's default tab handling (indent/dedent) is used. No special Escape-to-restore-focus behavior implemented yet.
