# Drizzle ORM + PostgreSQL — Spec

Setup do banco de dados para o DevRoast usando Drizzle ORM com PostgreSQL 17 via Docker Compose.

## Contexto

O DevRoast permite colar um trecho de codigo, que e analisado por IA e recebe uma "roast" com score, analise detalhada, diff de sugestoes e um veredicto. Os piores codigos aparecem no shame leaderboard. Nao ha autenticacao — submissions sao anonimas, rastreadas por session ID.

### Telas do design (Pencil)

| Tela | Descricao | Entidades envolvidas |
|---|---|---|
| Screen 1 — Code Input | Editor de codigo, toggle roast_mode, botao submit | `submissions` (insert) |
| Screen 2 — Roast Results | Score ring, roast quote, analysis cards (issues), diff de sugestao | `submissions`, `roast_results`, `analysis_issues`, `suggested_diffs` |
| Screen 3 — Shame Leaderboard | Lista rankeada por score com preview de codigo | `submissions`, `roast_results` |
| Screen 4 — OG Image | Card social com score, veredicto e quote | `submissions`, `roast_results` |

---

## Enums

```ts
// src/db/schema.ts

import { pgEnum } from "drizzle-orm/pg-core";

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
```

Estes enums derivam diretamente do design:
- **`language`** — linguagens suportadas no editor (spec `syntax-highlight-editor.md`) + `"unknown"` fallback.
- **`verdict`** — os labels do badge no roast result (`needs_serious_help`, `could_be_better`, `looks_clean`).
- **`issue_severity`** — mapeia 1:1 com o componente `Badge` (`critical`, `warning`, `good`).
- **`diff_line_type`** — mapeia 1:1 com o componente `DiffLine` (`added`, `removed`, `context`).

---

## Tabelas

### `submissions`

A submissao de codigo feita pelo usuario. Ponto de entrada de todo o fluxo.

```ts
import { pgTable, uuid, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";

export const submissions = pgTable("submissions", {
	id: uuid("id").primaryKey().defaultRandom(),
	sessionId: text("session_id").notNull(),
	code: text("code").notNull(),
	language: languageEnum("language").notNull().default("unknown"),
	lineCount: integer("line_count").notNull(),
	roastMode: boolean("roast_mode").notNull().default(true),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});
```

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | `uuid` PK | Identificador unico |
| `session_id` | `text` | ID anonimo da sessao do usuario |
| `code` | `text` | Codigo fonte submetido |
| `language` | `language` enum | Linguagem detectada ou selecionada |
| `line_count` | `integer` | Numero de linhas (pre-calculado pra queries do leaderboard) |
| `roast_mode` | `boolean` | Se o roast mode (sarcasmo maximo) estava ativo |
| `created_at` | `timestamptz` | Data/hora da submissao |

### `roast_results`

O resultado da analise por IA. Relacao 1:1 com `submissions`.

```ts
export const roastResults = pgTable("roast_results", {
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
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});
```

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | `uuid` PK | Identificador unico |
| `submission_id` | `uuid` FK unique | Referencia a submission (1:1) |
| `score` | `integer` | Nota de 0 a 10 |
| `verdict` | `verdict` enum | Veredicto geral (`needs_serious_help`, etc.) |
| `roast_text` | `text` | A frase de roast exibida no hero (ex: "this code looks like it was written during a power outage...") |
| `model` | `text` | Modelo de IA usado (ex: `gpt-4o`, `claude-sonnet-4-20250514`) |
| `prompt_tokens` | `integer` | Tokens de prompt consumidos (nullable, debug/custos) |
| `completion_tokens` | `integer` | Tokens de completion consumidos |
| `latency_ms` | `integer` | Tempo de resposta da IA em ms |
| `created_at` | `timestamptz` | Data/hora da geracao |

### `analysis_issues`

Issues individuais encontradas na analise. Relacao N:1 com `roast_results`. Cada card de issue na Screen 2 e uma row desta tabela.

```ts
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
```

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | `uuid` PK | Identificador unico |
| `roast_result_id` | `uuid` FK | Referencia ao resultado |
| `severity` | `issue_severity` enum | `critical`, `warning` ou `good` |
| `title` | `text` | Titulo curto (ex: "using var instead of const/let") |
| `description` | `text` | Descricao detalhada |
| `sort_order` | `integer` | Ordem de exibicao (critical primeiro) |

### `suggested_diffs`

Linhas do diff sugerido. Relacao N:1 com `roast_results`. Cada linha do diff na Screen 2 e uma row.

```ts
export const suggestedDiffs = pgTable("suggested_diffs", {
	id: uuid("id").primaryKey().defaultRandom(),
	roastResultId: uuid("roast_result_id")
		.notNull()
		.references(() => roastResults.id, { onDelete: "cascade" }),
	lineType: diffLineTypeEnum("line_type").notNull(),
	content: text("content").notNull(),
	sortOrder: integer("sort_order").notNull(),
});
```

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | `uuid` PK | Identificador unico |
| `roast_result_id` | `uuid` FK | Referencia ao resultado |
| `line_type` | `diff_line_type` enum | `added`, `removed` ou `context` |
| `content` | `text` | Conteudo da linha |
| `sort_order` | `integer` | Posicao da linha no diff |

---

## Relations (Drizzle `relations()`)

```ts
import { relations } from "drizzle-orm";

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

export const analysisIssuesRelations = relations(
	analysisIssues,
	({ one }) => ({
		roastResult: one(roastResults, {
			fields: [analysisIssues.roastResultId],
			references: [roastResults.id],
		}),
	}),
);

export const suggestedDiffsRelations = relations(
	suggestedDiffs,
	({ one }) => ({
		roastResult: one(roastResults, {
			fields: [suggestedDiffs.roastResultId],
			references: [roastResults.id],
		}),
	}),
);
```

### Diagrama ER

```
submissions 1──1 roast_results 1──N analysis_issues
                               1──N suggested_diffs
```

---

## Indices

```ts
import { index } from "drizzle-orm/pg-core";

// Em submissions:
// - Leaderboard query: ORDER BY score ASC, created_at DESC
// - Filter por session: WHERE session_id = ?

// Em roast_results:
// - Join com submissions no leaderboard
// - index no score pra ranking

// Indices adicionados inline ou via .index():
export const submissionsSessionIdx = index("idx_submissions_session_id")
	.on(submissions.sessionId);

export const roastResultsScoreIdx = index("idx_roast_results_score")
	.on(roastResults.score);
```

---

## Docker Compose

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:17-alpine
    container_name: devroast-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: devroast
      POSTGRES_PASSWORD: devroast
      POSTGRES_DB: devroast
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## Estrutura de arquivos

```
devroast/
├── docker-compose.yml
├── .env.local                  # DATABASE_URL
├── drizzle.config.ts           # Configuracao do Drizzle Kit
└── src/
    └── db/
        ├── index.ts            # Conexao + export do db client
        ├── schema.ts           # Enums + tabelas + relations
        └── migrations/         # Gerado pelo drizzle-kit
```

---

## Dependencias

| Pacote | Proposito |
|---|---|
| `drizzle-orm` | ORM type-safe |
| `drizzle-kit` | CLI pra migrations e studio |
| `postgres` | Driver PostgreSQL (postgres.js) |

```bash
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit
```

---

## Arquivos de configuracao

### `drizzle.config.ts`

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./src/db/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
});
```

### `.env.local`

```
DATABASE_URL=postgresql://devroast:devroast@localhost:5432/devroast
```

### `src/db/index.ts`

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle(client, { schema });
```

---

## Queries tipicas

### Leaderboard (Screen 3)

```ts
const leaderboard = await db
	.select({
		rank: sql<number>`row_number() over (order by ${roastResults.score} asc)`,
		score: roastResults.score,
		verdict: roastResults.verdict,
		code: submissions.code,
		language: submissions.language,
		lineCount: submissions.lineCount,
		roastText: roastResults.roastText,
		createdAt: submissions.createdAt,
	})
	.from(submissions)
	.innerJoin(roastResults, eq(roastResults.submissionId, submissions.id))
	.orderBy(asc(roastResults.score), desc(submissions.createdAt))
	.limit(50);
```

### Resultado completo (Screen 2)

```ts
const result = await db.query.submissions.findFirst({
	where: eq(submissions.id, submissionId),
	with: {
		roastResult: {
			with: {
				issues: { orderBy: [asc(analysisIssues.sortOrder)] },
				diffs: { orderBy: [asc(suggestedDiffs.sortOrder)] },
			},
		},
	},
});
```

### Stats do footer (Screen 1)

```ts
const stats = await db
	.select({
		totalRoasted: count(),
		avgScore: avg(roastResults.score),
	})
	.from(roastResults);
```

---

## Implementacao — To-do

### 1. Infraestrutura

- [ ] Criar `docker-compose.yml` na raiz do projeto
- [ ] Criar `.env.local` com `DATABASE_URL`
- [ ] Adicionar `.env.local` ao `.gitignore` (se nao estiver)
- [ ] Instalar dependencias: `drizzle-orm`, `postgres`, `drizzle-kit`

### 2. Schema

- [ ] Criar `src/db/schema.ts` com enums, tabelas e relations
- [ ] Criar `src/db/index.ts` com conexao ao banco
- [ ] Criar `drizzle.config.ts` na raiz

### 3. Migrations

- [ ] Rodar `docker compose up -d` pra subir o Postgres
- [ ] Rodar `pnpm drizzle-kit generate` pra gerar a migration inicial
- [ ] Rodar `pnpm drizzle-kit migrate` pra aplicar
- [ ] Verificar com `pnpm drizzle-kit studio` que tudo esta correto

### 4. Scripts no package.json

- [ ] Adicionar script `db:generate` → `drizzle-kit generate`
- [ ] Adicionar script `db:migrate` → `drizzle-kit migrate`
- [ ] Adicionar script `db:studio` → `drizzle-kit studio`

### 5. Validacao

- [ ] Rodar `pnpm build` — garantir que nao ha erros de TypeScript
- [ ] Rodar `pnpm check` — garantir que Biome esta satisfeito
- [ ] Verificar que o schema Drizzle gera SQL compativel com as queries tipicas listadas acima
