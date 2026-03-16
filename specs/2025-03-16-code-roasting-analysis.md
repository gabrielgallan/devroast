# Code Roasting & Analysis Feature

**Status**: Design (Ready for Implementation)  
**Date**: 2025-03-16  
**Owner**: DevRoast Team

---

## Overview

Implementar a feature central do DevRoast: análise de código via IA com suporte a "roast mode" (tom sarcástico). Usuários enviam trechos de código, recebem análise detalhada com score, veredicto, problemas identificados e sugestões de correção.

### Requisitos Funcionais

1. **Envio de código**: usuário cola código, seleciona modo (padrão ou roast), clica "Analisar"
2. **Análise de IA**: integração com OpenAI GPT-4o para gerar análise estruturada
3. **Roast Mode**: toggle que muda o tom da análise para sarcástico/cômico
4. **Resultados**: exibição com score (0-100), veredicto, comentário, problemas e sugestões
5. **Polling**: página de resultados aguarda análise em tempo real via polling
6. **Tratamento de erros**: exibir mensagens amigáveis se a API falhar

### Fora do Escopo

- Funcionalidade de compartilhamento (deixar para depois)
- Histórico de análises do usuário
- Análise em tempo real enquanto digita

---

## Arquitetura do Sistema

### Fluxo de Dados

```
1. User submits code
   ↓
2. CodeEditor → roast.submit (mutation)
   ↓
3. Create submissions record, return submissionId
   ↓
4. Client redirects to /roast/[submissionId]
   ↓
5. scheduleAnalysis() triggered in background
   ├─ Call OpenAI GPT-4o with code + roastMode
   ├─ Parse JSON response
   ├─ Create roast_result + analysis_issues + suggested_diffs
   └─ Handle errors gracefully
   ↓
6. Results page polls via useSuspenseQuery + refetchInterval
   ├─ Show skeleton until roast_result exists
   ├─ Once ready, display full analysis
   └─ If error, show error message
```

### Estados da Análise

A análise passa por três estados:

| Estado | Descrição | Ação |
|--------|-----------|------|
| **Pending** | `roast_results` não existe | Continuar polling |
| **Processing** | `roast_results` existe, `roastText` null | Continuar polling |
| **Ready** | `roast_results` completo | Exibir resultados |
| **Error** | `roast_results` com `error_message` | Exibir erro, parar polling |

---

## Integração OpenAI GPT-4o

### Dependências

| Pacote | Propósito | Status |
|--------|-----------|--------|
| `openai` (v4.x) | SDK Node.js para OpenAI | Novo |
| `zod` (v4.x) | Validação de resposta JSON | Já existe |

### Módulo `src/lib/openai.ts`

Nova função helper para chamar a API:

```ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type RoastAnalysis = {
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
```

### Tratamento de Erros

Se a chamada à API falhar:
1. Catch a exceção (timeout, rate limit, API error, parse error)
2. Formatar mensagem amigável:
   - "Rate limited. Try again in a few minutes."
   - "API service unavailable. Please try again later."
   - "Invalid code or language not supported."
3. Salvar `error_message` em `roast_results`
4. Página de resultados exibe o erro em vez do skeleton

---

## Alterações no Banco de Dados

### Nova Coluna em `roast_results`

```sql
ALTER TABLE roast_results ADD COLUMN error_message TEXT DEFAULT NULL;
```

Permite armazenar mensagens de erro da API para exibição no frontend. Coluna é `DEFAULT NULL` para suportar análises bem-sucedidas.

### Schema Notes

Após adicionar a coluna, atualizar `src/db/schema.ts`:

```ts
export const roastResults = pgTable(
  "roast_results",
  {
    // ... existing columns ...
    errorMessage: text("error_message"), // NEW: optional, for error storage
  },
);
```

Rodar migration:
```bash
pnpm db:generate  # gera SQL no migrations/
pnpm db:migrate   # aplica ao banco
```

---

## tRPC Procedures

### `roast.submit` (Mutation)

**Input**:
```ts
{
  code: string (1-100k chars)
  language: string (must match one of the 21 supported languages in schema)
  lineCount: number (1-2000)
  roastMode: boolean
}
```

Supported languages: `javascript`, `typescript`, `tsx`, `python`, `rust`, `go`, `html`, `css`, `json`, `sql`, `bash`, `c`, `cpp`, `java`, `ruby`, `php`, `swift`, `kotlin`, `yaml`, `markdown`, `unknown`.

**Output**:
```ts
{ submissionId: uuid }
```

**Comportamento**:
1. Criar `submissions` record
2. Chamar `scheduleAnalysis()` em background (fire-and-forget, sem await)
3. Retornar `submissionId` imediatamente (não bloqueia)

**Implementação da `scheduleAnalysis()`**:

```ts
import { generateRoastAnalysis, formatErrorMessage } from "@/lib/openai";

async function scheduleAnalysis(
  submissionId: string,
  code: string,
  language: string,
  roastMode: boolean,
): Promise<void> {
  try {
    const analysis = await generateRoastAnalysis(code, language, roastMode);

    // Transação: garantir que todas as inserts succedem ou todas falham
    await db.transaction(async (tx) => {
      const [result] = await tx
        .insert(roastResults)
        .values({
          submissionId,
          score: analysis.score,
          verdict: analysis.verdict,
          roastText: analysis.roastText,
          model: analysis.model,
          promptTokens: analysis.promptTokens,
          completionTokens: analysis.completionTokens,
          latencyMs: analysis.latencyMs,
        })
        .returning({ id: roastResults.id });

      // Salvar issues
      if (analysis.issues.length > 0) {
        await tx.insert(analysisIssues).values(
          analysis.issues.map((issue, index) => ({
            roastResultId: result.id,
            severity: issue.severity,
            title: issue.title,
            description: issue.description,
            sortOrder: index,
          })),
        );
      }

      // Salvar diffs
      if (analysis.diffs.length > 0) {
        await tx.insert(suggestedDiffs).values(
          analysis.diffs.map((diff, index) => ({
            roastResultId: result.id,
            lineType: diff.type,
            content: diff.content,
            sortOrder: index,
          })),
        );
      }
    });
  } catch (error) {
    // Salvar erro para exibição
    const errorMessage = formatErrorMessage(error);
    await db
      .insert(roastResults)
      .values({
        submissionId,
        score: 0,
        verdict: "needs_serious_help",
        roastText: "Analysis failed",
        errorMessage,
        model: "gpt-4o",
      });
  }
}

// Fire-and-forget: schedule background analysis without awaiting
void scheduleAnalysis(submission.id, input.code, input.language, input.roastMode)
  .catch((err) => {
    console.error("[scheduleAnalysis] Unhandled error:", err);
    // Log to monitoring service (e.g., Sentry) if available
  });
```

### `roast.getById` (Query)

**Input**: `{ id: uuid }`

**Output**:
```ts
{
  id: uuid
  score: number
  verdict: "looks_clean" | "could_be_better" | "needs_serious_help"
  roastText: string
  language: string
  lineCount: number
  code: string
  issues: Array<{
    severity: "critical" | "warning" | "good"
    title: string
    description: string
  }>
  diffs: Array<{
    type: "added" | "removed" | "context"
    content: string
    sortOrder: number
  }>
  errorMessage?: string // presente se houver erro na análise
} | throws NOT_FOUND
```

**Comportamento**:
1. Procurar por `roastResults.id` ou `roastResults.submissionId` (ambos funcionam)
2. Se não encontrar → throw `NOT_FOUND` (indica estado Pending, ainda processando)
3. Se encontrar → retornar resultado completo:
   - Se `errorMessage` está presente: análise falhou, exibir erro
   - Caso contrário: análise completou com sucesso

---

## UI & Componentes

### Página de Resultados: `/roast/[id]/page.tsx`

**Server Component**:
1. Prefetch `trpc.roast.getById` via `prefetch()`
2. Render `HydrateClient` wrapper
3. Wrap client component em `<Suspense fallback={<RoastResultSkeleton />}>`

**Client Component** (`RoastResultDisplay`):
1. Chamar `useSuspenseQuery(trpc.roast.getById.queryOptions())`
2. Com `refetchInterval: 2000` (polling a cada 2 segundos), `refetchIntervalInBackground: false`
3. Lidar com estados:
   - **Loading (Suspense)**: mostrar skeleton
   - **Error da query (NOT_FOUND)**: continuar polling (ainda está processando)
   - **Error com `errorMessage`**: exibir mensagem de erro, parar polling
   - **Success**: exibir análise completa (score, veredicto, problemas, sugestões)

**Polling Behavior**:
- Se `getById` lança `NOT_FOUND`: React Query retenha o skeleton, continue refetch
- Se `getById` retorna com `errorMessage`: Suspense resolva, exiba erro
- Se `getById` retorna sem `errorMessage`: Suspense resolva, exiba resultados

### Novo Componente: `RoastResultSkeleton`

Skeleton que corresponde ao layout real para evitar layout shift.

---

## Configuração de Ambiente

Adicionar ao `.env.local`:
```
OPENAI_API_KEY=sk-...
```

O módulo `src/lib/openai.ts` lê esta variável e inicializa o cliente OpenAI.

---

## Arquivos a Modificar/Criar

### Novos Arquivos

1. `src/lib/openai.ts` — integração com OpenAI GPT-4o, `generateRoastAnalysis()`, `formatErrorMessage()`
2. `src/components/ui/roast-result-skeleton.tsx` — skeleton para resultados
3. `src/components/ui/roast-result-display.tsx` — exibição de análise com polling + error handling

### Arquivos Modificados

1. `src/db/schema.ts` — adicionar coluna `errorMessage: text("error_message")` a `roastResults`
2. `src/trpc/routers/roast.ts`:
   - Implementar `scheduleAnalysis()` function
   - Atualizar `submit` mutation para validar `language` contra enum
   - Adicionar `import { generateRoastAnalysis } from "@/lib/openai"`
3. `src/app/roast/[id]/page.tsx` — implementar com prefetch + Suspense
4. `package.json` — adicionar `"openai": "^4.x"` dependency
5. `.env.local` — adicionar `OPENAI_API_KEY=sk-...`

### Migration

Após modificar schema:
```bash
pnpm db:generate
pnpm db:migrate
```

---

## Implementação — To-do

### Fase 1: Setup & Dependencies

- [ ] Instalar `openai` package: `pnpm add openai`
- [ ] Adicionar `OPENAI_API_KEY` a `.env.local`
- [ ] Criar `src/lib/openai.ts` com `generateRoastAnalysis()` e `formatErrorMessage()`

### Fase 2: Database

- [ ] Modificar `src/db/schema.ts`: adicionar `errorMessage` coluna a `roastResults`
- [ ] Executar `pnpm db:generate` para gerar migration
- [ ] Executar `pnpm db:migrate` para aplicar ao banco

### Fase 3: tRPC API

- [ ] Atualizar `src/trpc/routers/roast.ts`:
  - Implementar `scheduleAnalysis()` com transação + error handling
  - Adicionar validação de `language` contra enum em `submit` input
  - Usar `void scheduleAnalysis(...).catch(...)` para fire-and-forget
- [ ] Testar: `pnpm build` (sem erros TypeScript)

### Fase 4: UI Components

- [ ] Criar `src/components/ui/roast-result-skeleton.tsx` (layout matching)
- [ ] Criar `src/components/ui/roast-result-display.tsx`:
  - `useSuspenseQuery` com polling
  - Lidar com NOT_FOUND (continue skeleton)
  - Lidar com errorMessage (exibir erro)
  - Lidar com success (exibir análise)

### Fase 5: Results Page

- [ ] Implementar `/roast/[id]/page.tsx`:
  - Server component com `prefetch(trpc.roast.getById.queryOptions())`
  - `<HydrateClient>` wrapper
  - `<Suspense fallback={<RoastResultSkeleton />}>` com client component
- [ ] Testar: navegação redirect após submit

### Fase 6: E2E Testing

- [ ] Fluxo completo: submit código → redirect → polling → exibição
- [ ] Testar roast mode (tone diferente)
- [ ] Testar error handling (simular API failure)
- [ ] Verificar `pnpm check` (linting/format)
- [ ] Verificar `pnpm build` (no TypeScript errors)

---

## Critérios de Aceitação

- ✅ Usuário consegue enviar código e escolher roast mode
- ✅ Redirect imediato para página de resultados (sem esperar análise)
- ✅ Página mostra skeleton enquanto aguarda resultado
- ✅ Análise é feita pela OpenAI GPT-4o no background (fire-and-forget)
- ✅ Resultados aparecem na página via polling (máx 2-3s de latência)
- ✅ Roast mode muda o tom da análise para sarcástico (não estrutura)
- ✅ Se API falhar, erro amigável é exibido (não crash)
- ✅ Score alinhado com verdict (0-33 serious, 34-66 improve, 67-100 good)
- ✅ Issues e diffs aparecem em ordem (sortOrder respeitada)
- ✅ Polling para quando erro ocorre ou sucesso é alcançado
- ✅ Database transaction garante consistência (tudo ou nada)
- ✅ Build passa: `pnpm build` sem erros
- ✅ Lint passa: `pnpm check` sem erros

## Notas de Implementação

### Session Tracking

O `submissions` table requer `sessionId`. Estratégia atual: gerar novo UUID por submission via `crypto.randomUUID()`. Isto rastreia cada envio como uma sessão separada. Para rastreamento de sessão persistente, seria necessário usar cookies (fora do escopo desta feature).

### Language Validation

O `language` input deve ser validado contra o enum `languageEnum` em `schema.ts`. Usar Zod `.enum()` na entrada do `submit` mutation.

### Error Recovery

Se `scheduleAnalysis()` falhar após criar `roast_results` (parcial), a transação reverte automaticamente. O usuário não vê resultado algum até que análise complete com sucesso. Sem polling, isso seria um hang; com polling, o frontend continua tentando até erro aparecer.

### Future Improvements (Fora do Escopo)

- WebSocket em vez de polling (mais eficiente)
- Job queue (Bull, Inngest) para análises em paralelo
- Caching de análises duplicadas
- Histórico de análises por usuário
- Compartilhamento com link único
