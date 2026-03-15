CREATE TYPE "public"."diff_line_type" AS ENUM('added', 'removed', 'context');--> statement-breakpoint
CREATE TYPE "public"."issue_severity" AS ENUM('critical', 'warning', 'good');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('javascript', 'typescript', 'tsx', 'python', 'rust', 'go', 'html', 'css', 'json', 'sql', 'bash', 'c', 'cpp', 'java', 'ruby', 'php', 'swift', 'kotlin', 'yaml', 'markdown', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('looks_clean', 'could_be_better', 'needs_serious_help');--> statement-breakpoint
CREATE TABLE "analysis_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roast_result_id" uuid NOT NULL,
	"severity" "issue_severity" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roast_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"verdict" "verdict" NOT NULL,
	"roast_text" text NOT NULL,
	"model" text NOT NULL,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roast_results_submission_id_unique" UNIQUE("submission_id")
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"code" text NOT NULL,
	"language" "language" DEFAULT 'unknown' NOT NULL,
	"line_count" integer NOT NULL,
	"roast_mode" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suggested_diffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roast_result_id" uuid NOT NULL,
	"line_type" "diff_line_type" NOT NULL,
	"content" text NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analysis_issues" ADD CONSTRAINT "analysis_issues_roast_result_id_roast_results_id_fk" FOREIGN KEY ("roast_result_id") REFERENCES "public"."roast_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roast_results" ADD CONSTRAINT "roast_results_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggested_diffs" ADD CONSTRAINT "suggested_diffs_roast_result_id_roast_results_id_fk" FOREIGN KEY ("roast_result_id") REFERENCES "public"."roast_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_roast_results_score" ON "roast_results" USING btree ("score");--> statement-breakpoint
CREATE INDEX "idx_submissions_session_id" ON "submissions" USING btree ("session_id");