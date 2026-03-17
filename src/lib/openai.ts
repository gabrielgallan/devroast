import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export type RoastAnalysis = {
	score: number;
	verdict: "looks_clean" | "could_be_better" | "needs_serious_help";
	roastText: string;
	issues: Array<{
		severity: "critical" | "warning" | "good";
		title: string;
		description: string;
	}>;
	diffs: Array<{
		type: "added" | "removed" | "context";
		content: string;
	}>;
	model: string;
	promptTokens: number;
	completionTokens: number;
	latencyMs: number;
};

export async function generateRoastAnalysis(
	code: string,
	language: string,
	roastMode: boolean,
): Promise<RoastAnalysis> {
	const startTime = Date.now();

	const tone = roastMode
		? "Provide brutally honest, sarcastic, humorous feedback. Be witty and entertaining while critiquing the code."
		: "Provide professional, constructive feedback. Be helpful and educational.";

	// Score ranges: 0-33 = needs_serious_help, 34-66 = could_be_better, 67-100 = looks_clean
	const prompt = `
You are an expert code reviewer. Analyze the following ${language} code and provide detailed feedback:

\`\`\`${language}
${code}
\`\`\`

${tone}

Return a JSON object with:
- score: integer from 0-100 (0-33 serious problems, 34-66 needs improvement, 67-100 good code)
- verdict: one of "looks_clean", "could_be_better", or "needs_serious_help"
- roastText: string with main commentary (${roastMode ? "sarcastic and humorous" : "professional"} tone)
- issues: array of objects with {severity: "critical"|"warning"|"good", title: string, description: string}
- diffs: array of objects with {type: "added"|"removed"|"context", content: string}

Ensure score aligns with verdict.
`;

	const response = await openai.chat.completions.create({
		model: "gpt-4o",
		messages: [{ role: "user", content: prompt }],
		response_format: { type: "json_object" },
		temperature: roastMode ? 0.8 : 0.5,
	});

	const content = response.choices[0].message.content || "";
	const parsed = JSON.parse(content) as RoastAnalysis;

	return {
		score: parsed.score,
		verdict: parsed.verdict,
		roastText: parsed.roastText,
		issues: parsed.issues,
		diffs: parsed.diffs,
		model: "gpt-4o",
		promptTokens: response.usage?.prompt_tokens || 0,
		completionTokens: response.usage?.completion_tokens || 0,
		latencyMs: Date.now() - startTime,
	};
}

export function formatErrorMessage(error: unknown): string {
	if (error instanceof OpenAI.RateLimitError) {
		return "Rate limited. OpenAI API is experiencing high demand. Please try again in a few minutes.";
	}
	if (error instanceof OpenAI.APIError) {
		if (error.status === 401) {
			return "API authentication failed. Contact support.";
		}
		if (error.status === 503) {
			return "OpenAI service is temporarily unavailable. Please try again later.";
		}
		return `API error (${error.status}): ${error.message}`;
	}
	if (error instanceof SyntaxError) {
		return "Failed to parse API response. This may indicate an unsupported code format.";
	}
	if (error instanceof Error) {
		return `Analysis error: ${error.message}`;
	}
	return "Analysis failed for unknown reasons. Please try again.";
}
