import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

// ── Enums ───────────────────────────────────────────────────

export const languageEnum = pgEnum("language", [
	"javascript",
	"typescript",
	"tsx",
	"python",
	"rust",
	"go",
	"html",
	"css",
	"json",
	"sql",
	"bash",
	"c",
	"cpp",
	"java",
	"ruby",
	"php",
	"swift",
	"kotlin",
	"yaml",
	"markdown",
	"unknown",
]);

export const verdictEnum = pgEnum("verdict", [
	"looks_clean",
	"could_be_better",
	"needs_serious_help",
]);

export const issueSeverityEnum = pgEnum("issue_severity", [
	"critical",
	"warning",
	"good",
]);

export const diffLineTypeEnum = pgEnum("diff_line_type", [
	"added",
	"removed",
	"context",
]);

// ── Tables ──────────────────────────────────────────────────

export const submissions = pgTable(
	"submissions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		sessionId: text("session_id").notNull(),
		code: text("code").notNull(),
		language: languageEnum("language").notNull().default("unknown"),
		lineCount: integer("line_count").notNull(),
		roastMode: boolean("roast_mode").notNull().default(true),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [index("idx_submissions_session_id").on(table.sessionId)],
);

export const roastResults = pgTable(
	"roast_results",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		submissionId: uuid("submission_id")
			.notNull()
			.unique()
			.references(() => submissions.id, { onDelete: "cascade" }),
		score: integer("score").notNull(),
		verdict: verdictEnum("verdict").notNull(),
		roastText: text("roast_text").notNull(),
		model: text("model").notNull(),
		promptTokens: integer("prompt_tokens"),
		completionTokens: integer("completion_tokens"),
		latencyMs: integer("latency_ms"),
		errorMessage: text("error_message"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [index("idx_roast_results_score").on(table.score)],
);

export const analysisIssues = pgTable("analysis_issues", {
	id: uuid("id").primaryKey().defaultRandom(),
	roastResultId: uuid("roast_result_id")
		.notNull()
		.references(() => roastResults.id, { onDelete: "cascade" }),
	severity: issueSeverityEnum("severity").notNull(),
	title: text("title").notNull(),
	description: text("description").notNull(),
	sortOrder: integer("sort_order").notNull().default(0),
});

export const suggestedDiffs = pgTable("suggested_diffs", {
	id: uuid("id").primaryKey().defaultRandom(),
	roastResultId: uuid("roast_result_id")
		.notNull()
		.references(() => roastResults.id, { onDelete: "cascade" }),
	lineType: diffLineTypeEnum("line_type").notNull(),
	content: text("content").notNull(),
	sortOrder: integer("sort_order").notNull(),
});

// ── Relations ───────────────────────────────────────────────

export const submissionsRelations = relations(submissions, ({ one }) => ({
	roastResult: one(roastResults, {
		fields: [submissions.id],
		references: [roastResults.submissionId],
	}),
}));

export const roastResultsRelations = relations(
	roastResults,
	({ one, many }) => ({
		submission: one(submissions, {
			fields: [roastResults.submissionId],
			references: [submissions.id],
		}),
		issues: many(analysisIssues),
		diffs: many(suggestedDiffs),
	}),
);

export const analysisIssuesRelations = relations(analysisIssues, ({ one }) => ({
	roastResult: one(roastResults, {
		fields: [analysisIssues.roastResultId],
		references: [roastResults.id],
	}),
}));

export const suggestedDiffsRelations = relations(suggestedDiffs, ({ one }) => ({
	roastResult: one(roastResults, {
		fields: [suggestedDiffs.roastResultId],
		references: [roastResults.id],
	}),
}));
